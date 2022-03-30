import { admin as googleAdminAPI, auth as googleAuth } from "@googleapis/admin";
import { people as googlePeopleAPI } from "@googleapis/people";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import {
  pandaSettingsBucketName,
  getPandaConfig,
} from "../../shared/panDomainAuth";
import { p12ToPem } from "./p12ToPem";
import { getPinboardPermissionOverrides } from "../../shared/permissions";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

const GUARDIAN_EMAIL_DOMAIN = "@guardian.co.uk";

interface BasicUser {
  resourceName?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isMentionable: boolean;
}

const S3 = new AWS.S3(standardAwsConfig);
const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);

export const handler = async () => {
  const now = new Date();
  const usersTableName = getEnvironmentVariableOrThrow("usersTableName");

  const getStoredUsers = async (
    startKey?: DocumentClient.Key
  ): Promise<BasicUser[]> => {
    const userResults = await dynamo
      .scan({
        TableName: usersTableName,
        ExclusiveStartKey: startKey,
        AttributesToGet: ["email", "isMentionable"],
      })
      .promise();

    const storedUsers =
      userResults.Items?.map((user) => user as BasicUser) || [];

    if (userResults.LastEvaluatedKey) {
      return [
        ...storedUsers,
        ...(await getStoredUsers(userResults.LastEvaluatedKey)),
      ];
    } else {
      return storedUsers;
    }
  };

  const emailsOfUsersWithPinboardPermission = (
    await getPinboardPermissionOverrides(S3)
  )?.reduce<string[]>(
    (acc, { userId, active }) => (active ? [...acc, userId] : acc),
    []
  );

  if (!emailsOfUsersWithPinboardPermission) {
    throw Error("Could not get list of users with 'pinboard' permission.");
  }

  const isNightlyFullRun = now.getHours() === 0 && now.getMinutes() === 0;

  const storedUsers = await getStoredUsers();
  const storedUsersEmails = storedUsers.map(({ email }) => email);

  const basicUsersWherePinboardPermissionRemoved = storedUsers.reduce<
    BasicUser[]
  >(
    (acc, { email, isMentionable }) =>
      isMentionable && !emailsOfUsersWithPinboardPermission.includes(email)
        ? [
            ...acc,
            {
              email,
              isMentionable: false,
            },
          ]
        : acc,
    []
  );
  if (basicUsersWherePinboardPermissionRemoved.length > 0) {
    console.log(
      "DETECTED PINBOARD PERMISSIONS REMOVED FOR ",
      basicUsersWherePinboardPermissionRemoved.map(({ email }) => email)
    );
  }

  const emailsToLookup = emailsOfUsersWithPinboardPermission.filter(
    (email) => isNightlyFullRun || !storedUsersEmails.includes(email)
  );

  if (isNightlyFullRun) {
    console.log("NIGHTLY FULL RUN");
  } else if (emailsToLookup.length > 0) {
    console.log("DETECTED PINBOARD PERMISSIONS ADDED FOR ", emailsToLookup);
  } else if (basicUsersWherePinboardPermissionRemoved.length === 0) {
    console.log("NO CHANGE TO PINBOARD PERMISSIONS, exiting early");
    return;
  }

  const pandaConfig = await getPandaConfig<{
    googleServiceAccountId: string;
    googleServiceAccountCert: string;
    google2faUser: string;
  }>(S3);

  const serviceAccountPrivateKey = p12ToPem(
    (
      await S3.getObject({
        Bucket: pandaSettingsBucketName,
        Key: pandaConfig.googleServiceAccountCert,
      }).promise()
    ).Body?.toString("base64")
  );

  const auth = new googleAuth.JWT({
    key: serviceAccountPrivateKey,
    scopes: [
      "https://www.googleapis.com/auth/directory.readonly",
      "https://www.googleapis.com/auth/admin.directory.user.readonly",
      "https://www.googleapis.com/auth/admin.directory.group.member.readonly",
    ],
    email: pandaConfig.googleServiceAccountId,
    subject: pandaConfig.google2faUser,
  });

  const directoryService = googleAdminAPI({
    version: "directory_v1",
    auth,
  });

  const peopleService = googlePeopleAPI({
    version: "v1",
    auth,
  });

  const basicUsersWithPinboardPermission: BasicUser[] = await Promise.all(
    emailsToLookup.map(async (emailFromPermission) => {
      const userResult = await directoryService.users
        .get({
          userKey: emailFromPermission,
        })
        .catch((_) => _.response);

      if (userResult.status === 404) {
        return {
          email: emailFromPermission,
          isMentionable: false,
        };
      }
      if (!userResult.data) {
        throw Error("Invalid response from Google Directory API");
      }
      const { id, ...user } = userResult.data;
      const email = user.primaryEmail?.endsWith(GUARDIAN_EMAIL_DOMAIN)
        ? user.primaryEmail
        : user.emails.find((_: { address: string }) =>
            _.address.endsWith(GUARDIAN_EMAIL_DOMAIN)
          )?.address;
      return {
        resourceName: `people/${userResult.data.id}`,
        email,
        firstName: user.name?.givenName || undefined,
        lastName: user.name?.familyName || undefined,
        isMentionable: true,
      };
    })
  );

  interface PhotoUrlLookup {
    [resourceName: string]: string;
  }
  const buildPhotoUrlLookup = async (
    resourceNames: string[]
  ): Promise<PhotoUrlLookup> => {
    if (resourceNames.length === 0) {
      return {};
    }
    const hasMoreThan50Remaining = resourceNames.length > 50;
    const usersToRequestInThisBatch = hasMoreThan50Remaining
      ? resourceNames.slice(0, 50)
      : resourceNames;

    const thisBatchLookup = (
      await peopleService.people.getBatchGet({
        personFields: "photos",
        resourceNames: usersToRequestInThisBatch,
      })
    ).data.responses?.reduce((acc, { person, requestedResourceName }) => {
      const maybePhotoUrl = person?.photos?.find(({ url }) => url)?.url;
      return requestedResourceName && maybePhotoUrl
        ? {
            ...acc,
            [requestedResourceName]: maybePhotoUrl,
          }
        : acc;
    }, {} as PhotoUrlLookup);

    if (!thisBatchLookup) {
      throw Error();
    }

    return hasMoreThan50Remaining
      ? {
          ...thisBatchLookup,
          ...(await buildPhotoUrlLookup(
            resourceNames.slice(50, resourceNames.length)
          )),
        }
      : thisBatchLookup;
  };
  const photoUrlLookup = await buildPhotoUrlLookup(
    basicUsersWithPinboardPermission.reduce<string[]>(
      (acc, { resourceName }) => (resourceName ? [...acc, resourceName] : acc),
      []
    )
  );

  const usersToUpsert: BasicUser[] = [
    ...basicUsersWithPinboardPermission,
    ...basicUsersWherePinboardPermissionRemoved,
  ];

  return await Promise.allSettled(
    usersToUpsert.map(
      ({ resourceName, email, firstName, lastName, isMentionable }) => {
        const maybeAvatarUrl = resourceName && photoUrlLookup[resourceName];

        console.log(`Upserting details for user ${email}`);

        const upsertResult = dynamo
          .update({
            TableName: usersTableName,
            Key: {
              email,
            },
            UpdateExpression: `set isMentionable = :isMentionable${
              firstName ? ", firstName = :firstName" : ""
            }${lastName ? ", lastName = :lastName" : ""}${
              maybeAvatarUrl ? ", avatarUrl = :avatarUrl" : ""
            }`,
            ExpressionAttributeValues: {
              ":firstName": firstName,
              ":lastName": lastName,
              ":avatarUrl": maybeAvatarUrl,
              ":isMentionable": isMentionable,
            },
          })
          .promise();

        upsertResult.catch(console.error);

        return upsertResult;
      }
    )
  );
};
