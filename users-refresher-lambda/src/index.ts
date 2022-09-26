import {
  people as googlePeopleAPI,
  auth as googleAuth,
  people_v1,
} from "@googleapis/people";
import Schema$Person = people_v1.Schema$Person;
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import {
  pandaSettingsBucketName,
  getPandaConfig,
} from "../../shared/panDomainAuth";
import { p12ToPem } from "./p12ToPem";
import { getPinboardPermissionOverrides } from "../../shared/permissions";
import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { User } from "../../shared/graphql/graphql";

const MAX_USERS_TO_LOOKUP_IN_ONE_RUN = 100;

const S3 = new AWS.S3(standardAwsConfig);

export const handler = async ({
  isProcessPermissionChangesOnly,
}: {
  isProcessPermissionChangesOnly?: boolean;
}) => {
  const emailsOfUsersWithPinboardPermission = (
    await getPinboardPermissionOverrides(S3)
  )?.reduce<string[]>(
    (acc, { userId, active }) => (active ? [...acc, userId] : acc),
    []
  );
  if (!emailsOfUsersWithPinboardPermission) {
    throw Error("Could not get list of users with 'pinboard' permission.");
  }

  const sql = await getDatabaseConnection();
  const storedUsers =
    (await sql`SELECT "email", "isMentionable" FROM "User"`).map(
      (user) => user
    ) || [];
  const storedUsersEmails = storedUsers.map(({ email }) => email);

  for (const { isMentionable, email } of storedUsers) {
    if (isMentionable && !emailsOfUsersWithPinboardPermission.includes(email)) {
      console.log(
        `Pinboard permission removed for for user ${email} so marking them as NOT mentionable.`
      );

      await sql`
          UPDATE "User"
          SET "isMentionable"=${isMentionable}
          WHERE "email"=${email}
      `.catch((error) =>
        console.error(
          `Error marking user ${email} as not mentionable...\n`,
          error
        )
      );
    }
  }

  const allEmailsToLookup = emailsOfUsersWithPinboardPermission.filter(
    (email) =>
      !isProcessPermissionChangesOnly || !storedUsersEmails.includes(email)
  );
  const emailsToLookup = allEmailsToLookup.slice(
    0,
    MAX_USERS_TO_LOOKUP_IN_ONE_RUN
  );

  if (allEmailsToLookup.length > emailsToLookup.length) {
    console.log(
      `WARNING: There are ${allEmailsToLookup.length} users to lookup/process, which is too many for one run. Limiting to ${emailsToLookup.length}.`
    );
  }

  if (!isProcessPermissionChangesOnly) {
    console.log("FULL RUN");
  } else if (emailsToLookup.length > 0) {
    console.log("DETECTED PINBOARD PERMISSIONS ADDED FOR ", emailsToLookup);
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

  const peopleService = googlePeopleAPI({
    version: "v1",
    auth: new googleAuth.JWT({
      key: serviceAccountPrivateKey,
      scopes: ["https://www.googleapis.com/auth/directory.readonly"],
      email: pandaConfig.googleServiceAccountId,
      subject: pandaConfig.google2faUser,
    }),
  });

  for (const emailToLookup of emailsToLookup) {
    try {
      const namePartsOfEmail = emailToLookup.split("@")?.[0]?.split(".");

      const user: Omit<User, "__typename"> = await peopleService.people
        .searchDirectoryPeople({
          query: emailToLookup,
          readMask: "names,photos",
          sources: [
            "DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT",
            "DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE",
          ],
        })
        .then((response) => {
          const people: Schema$Person[] = response?.data?.people || [];
          if (people.length === 1) {
            const person: Schema$Person = people[0];
            return {
              email: emailToLookup,
              isMentionable: true,
              firstName:
                person.names?.[0].givenName || //FIXME names not coming through
                namePartsOfEmail?.[0] ||
                emailToLookup,
              lastName:
                person.names?.[0].familyName ||
                namePartsOfEmail?.[1] ||
                emailToLookup,
              avatarUrl: person.photos?.[0].url || null,
            };
          }
          if (people.length === 0) {
            return {
              email: emailToLookup,
              isMentionable: false,
              firstName: namePartsOfEmail?.[0] || emailToLookup,
              lastName: namePartsOfEmail?.[1] || emailToLookup,
              avatarUrl: null,
            };
          }
          throw Error(`More than one user found for email ${emailToLookup}`);
        });

      console.log(
        `Upserting details for user ${user.email} (isMentionable: ${user.isMentionable})`
      );

      await sql`
        INSERT INTO "User" ${sql(user)}
        ON CONFLICT ("email") DO UPDATE SET
        "firstName"=${user.firstName},
        "lastName"=${user.lastName},
        "isMentionable"=${user.isMentionable},
        "avatarUrl"=${user.avatarUrl}
    `.catch((error) => {
        console.error(`Error upserting user ${user.email}\n`, error);
        console.error(user);
      });
    } catch (error) {
      console.error(`Failed to lookup user ${emailToLookup}...\n`, error);
    }
  }
};
