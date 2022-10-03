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
import { getDatabaseConnection } from "../../shared/database/databaseConnection";

const MAX_USERS_TO_LOOKUP_IN_ONE_RUN = 50;

interface BasicUser {
  email: string;
  isMentionable: boolean;
}

interface UserFromGoogle extends BasicUser {
  resourceName: string;
  firstName: string;
  lastName: string;
}

const isUserFromGoogle = (
  user: BasicUser | UserFromGoogle
): user is UserFromGoogle => "resourceName" in user;

const S3 = new AWS.S3(standardAwsConfig);

export const handler = async ({
  isProcessPermissionChangesOnly,
}: {
  isProcessPermissionChangesOnly?: boolean;
}) => {
  const sql = await getDatabaseConnection();
  try {
    const getStoredUsers = async (): Promise<BasicUser[]> =>
      (
        await sql`SELECT "email", "isMentionable"
                 FROM "User"`
      ).map((user) => user as BasicUser) || [];

    const emailsOfUsersWithPinboardPermission = (
      await getPinboardPermissionOverrides(S3)
    )?.reduce<string[]>(
      (acc, { userId, active }) => (active ? [...acc, userId] : acc),
      []
    );

    if (!emailsOfUsersWithPinboardPermission) {
      throw Error("Could not get list of users with 'pinboard' permission.");
    }

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

    const allEmailsToLookup = isProcessPermissionChangesOnly
      ? emailsOfUsersWithPinboardPermission.filter(
          (email) => !storedUsersEmails.includes(email)
        )
      : emailsOfUsersWithPinboardPermission;

    const emailsToLookup = allEmailsToLookup.slice(
      0,
      MAX_USERS_TO_LOOKUP_IN_ONE_RUN
    );

    if (allEmailsToLookup.length > emailsToLookup.length) {
      console.log(
        `WARNING: there are ${allEmailsToLookup.length} emails to lookup/process which is too many for one run. Only processing ${MAX_USERS_TO_LOOKUP_IN_ONE_RUN} in this run.`
      );
    }

    if (!isProcessPermissionChangesOnly) {
      console.log("FULL RUN");
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

    // noinspection TypeScriptValidateJSTypes
    const usersWithPinboardPermission: Array<
      BasicUser | UserFromGoogle
    > = await Promise.all(
      emailsToLookup.map(async (emailFromPermission: string) => {
        const userResult = await directoryService.users
          .get({
            userKey: emailFromPermission,
          })
          .catch((_) => _.response);

        const namePartOfEmail = emailFromPermission.split("@")?.[0];
        const namePartsFromEmail = namePartOfEmail?.split(".");
        const firstNameFallback = namePartsFromEmail[0] || namePartOfEmail;
        const lastNameFallback = namePartsFromEmail[1] || namePartOfEmail;

        if (userResult.status === 404) {
          return {
            email: emailFromPermission,
            firstName: firstNameFallback,
            lastName: lastNameFallback,
            isMentionable: false,
          };
        }
        if (!userResult.data) {
          throw Error("Invalid response from Google Directory API");
        }
        const { id, ...user } = userResult.data;
        return {
          resourceName: `people/${id}`,
          email: emailFromPermission,
          firstName: user.name?.givenName || firstNameFallback,
          lastName: user.name?.familyName || lastNameFallback,
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
      usersWithPinboardPermission
        .filter(isUserFromGoogle)
        .map(({ resourceName }) => resourceName)
    );

    const usersToUpsert: Array<BasicUser | UserFromGoogle> = [
      ...usersWithPinboardPermission,
      ...basicUsersWherePinboardPermissionRemoved,
    ];

    for (const user of usersToUpsert) {
      console.log(`Upserting details for user ${user.email}`);

      const handleError = (error: Error) => {
        console.error(`Error upserting user ${user.email}\n`, error);
        console.error(user);
      };

      if (isUserFromGoogle(user) || "firstName" in user) {
        const { resourceName, ...userToUpsert } = user;
        const maybeAvatarUrl = photoUrlLookup[resourceName];
        await sql`
            INSERT INTO "User" ${sql(
              maybeAvatarUrl
                ? { ...userToUpsert, avatarUrl: maybeAvatarUrl }
                : userToUpsert
            )}
            ON CONFLICT ("email")
            DO UPDATE SET
            "firstName"=${user.firstName},
            "lastName"=${user.lastName},
            "isMentionable"=${user.isMentionable},
            "avatarUrl"=${maybeAvatarUrl || null}
        `.catch(handleError);
      } else {
        await sql`
            UPDATE "User"
            SET "isMentionable"=${user.isMentionable}
            WHERE "email" = ${user.email}
        `.catch(handleError);
      }
    }
  } finally {
    await sql.end();
  }
};
