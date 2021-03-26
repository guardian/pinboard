import {
  admin as googleAdminAPI,
  admin_directory_v1,
  auth as googleAuth,
} from "@googleapis/admin";
import { people as googlePeopleAPI } from "@googleapis/people";
import * as AWS from "aws-sdk";
import * as iniparser from "iniparser";
import { standardAwsConfig } from "../../shared/awsIntegration";
import {
  pandaConfigFilename,
  pandaSettingsBucketName,
} from "../../shared/panda";
import { p12ToPem } from "./p12ToPem";
import { getPinboardPermissionOverrides } from "../../shared/permissions";

const guardianEmailDomain = "@guardian.co.uk";

const pandaConfigLocation = {
  Bucket: pandaSettingsBucketName,
  Key: pandaConfigFilename,
};

const S3 = new AWS.S3(standardAwsConfig);
const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);
const usersTableName = process.env.USERS_TABLE_NAME;

export const handler = async () => {
  if (!usersTableName) {
    throw Error("'USERS_TABLE_NAME' environment variable not set.");
  }

  const emailsOfUsersWithPinboardPermission = (
    await getPinboardPermissionOverrides(S3)
  )?.reduce(
    (acc, { userId, active }) => (active ? [...acc, userId] : acc),
    [] as string[]
  );

  if (!emailsOfUsersWithPinboardPermission) {
    throw Error("Could not get list of users with 'pinboard' permission.");
  }

  const pandaConfigIni = (
    await S3.getObject(pandaConfigLocation).promise()
  ).Body?.toString();

  if (!pandaConfigIni) {
    throw Error(
      `could not read panda config ${JSON.stringify(pandaConfigLocation)}`
    );
  }

  const pandaConfig = iniparser.parseString(pandaConfigIni) as {
    googleServiceAccountId: string;
    googleServiceAccountCert: string;
    google2faUser: string;
  };

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

  const getAllUsers = async (
    nextPageToken?: string
  ): Promise<admin_directory_v1.Schema$User[]> => {
    const googleResponse = (
      await directoryService.users.list({
        customer: "my_customer",
        pageToken: nextPageToken,
        viewType: "domain_public",
        maxResults: 500,
      })
    ).data;

    if (!googleResponse.users) {
      console.error(googleResponse);
      throw Error(
        "Empty list of users in call to 'directoryService.users.list()'"
      );
    }

    return googleResponse.nextPageToken
      ? [
          ...googleResponse.users,
          ...(await getAllUsers(googleResponse.nextPageToken)),
        ]
      : googleResponse.users;
  };

  interface BasicUser {
    resourceName: string;
    email: string;
    firstName: string;
    lastName: string;
  }

  const basicUsersWithPinboardPermission = (await getAllUsers()).reduce(
    (acc, { id, ...user }) => {
      const email = user.primaryEmail?.endsWith(guardianEmailDomain)
        ? user.primaryEmail
        : user.emails.find((_: { address: string }) =>
            _.address.endsWith(guardianEmailDomain)
          );

      if (!emailsOfUsersWithPinboardPermission.includes(email)) {
        console.log(
          `Skipping ${email} as they do not have 'pinboard' permission.`
        );
        return acc;
      } else if (id && email && user.name?.givenName && user.name?.familyName) {
        return [
          ...acc,
          {
            resourceName: `people/${id}`,
            email,
            firstName: user.name.givenName,
            lastName: user.name.familyName,
          },
        ];
      } else {
        console.error(`Key information missing for user ${email}`, user);
        return acc;
      }
    },
    [] as BasicUser[]
  );

  interface PhotoUrlLookup {
    [resourceName: string]: string;
  }
  const buildPhotoUrlLookup = async (
    users: BasicUser[]
  ): Promise<PhotoUrlLookup> => {
    const hasMoreThan50Remaining = users.length > 50;
    const usersToRequestInThisBatch = hasMoreThan50Remaining
      ? users.slice(0, 50)
      : users;

    const thisBatchLookup = (
      await peopleService.people.getBatchGet({
        personFields: "photos",
        resourceNames: usersToRequestInThisBatch.map((_) => _.resourceName),
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
          ...(await buildPhotoUrlLookup(users.slice(50, users.length))),
        }
      : thisBatchLookup;
  };
  const photoUrlLookup = await buildPhotoUrlLookup(
    basicUsersWithPinboardPermission
  );

  return await Promise.allSettled(
    basicUsersWithPinboardPermission.map(
      ({ resourceName, email, firstName, lastName }) => {
        const maybeAvatarUrl = photoUrlLookup[resourceName];

        console.log(`Upserting details for user ${email}`);
        return dynamo
          .update({
            TableName: usersTableName,
            Key: {
              email,
            },
            UpdateExpression: `set firstName = :firstName, lastName = :lastName${
              maybeAvatarUrl ? ", avatarUrl = :avatarUrl" : ""
            }`,
            ExpressionAttributeValues: {
              ":firstName": firstName,
              ":lastName": lastName,
              ":avatarUrl": maybeAvatarUrl,
            },
          })
          .promise();
      }
    )
  );
};
