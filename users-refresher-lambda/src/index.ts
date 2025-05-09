import { admin as googleAdminAPI, auth as googleAuth } from "@googleapis/admin";
import { people as googlePeopleAPI } from "@googleapis/people";
import {
  pinboardConfigPromiseGetter,
  pinboardSecretPromiseGetter,
  STAGE,
} from "../../shared/awsIntegration";
import { getPinboardAccessPermissionOverrides } from "../../shared/permissions";
import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { buildPhotoUrlLookup } from "./google/buildPhotoUrlLookup";
import { buildUserLookupFromGoogle } from "./google/buildUserLookupFromGoogle";
import {
  extractNamesWithFallback,
  GroupsToLookup,
  handleUpsertError,
} from "./util";
import { buildUserLookupFromDatabase } from "./google/buildUserLookupFromDatabase";
import { getGroupMembersFromGoogle } from "./google/getGroupMembersFromGoogle";
import { getGroupDetailFromGoogle } from "./google/getGroupDetailFromGoogle";

export const handler = async ({
  isProcessPermissionChangesOnly,
}: {
  isProcessPermissionChangesOnly?: boolean;
}) => {
  const emailsOfUsersWithPinboardPermission = (
    await getPinboardAccessPermissionOverrides()
  )?.reduce<string[]>(
    (acc, { userId, active }) =>
      active ? [...acc, userId.toLowerCase()] : acc,
    []
  );
  if (!emailsOfUsersWithPinboardPermission) {
    throw Error("Could not get list of users with 'pinboard' permission.");
  }

  const sql = await getDatabaseConnection();

  try {
    const usersFromDatabaseLookup = await buildUserLookupFromDatabase(sql);

    for (const user of Object.values(usersFromDatabaseLookup)) {
      if (
        user.isMentionable &&
        !emailsOfUsersWithPinboardPermission.includes(user.email)
      ) {
        console.log(
          `Permission removed for ${user.email}, so marking as not mentionable`
        );
        await sql`
          UPDATE "User" 
          SET "isMentionable" = false 
          WHERE "email" = ${user.email}
        `.catch(handleUpsertError(user));
      }
    }

    if (
      isProcessPermissionChangesOnly &&
      emailsOfUsersWithPinboardPermission.every((email) => {
        const maybeUserFromDatabase = usersFromDatabaseLookup[email];
        const isStoredInCorrectState =
          maybeUserFromDatabase &&
          (maybeUserFromDatabase.isMentionable ||
            !maybeUserFromDatabase.googleID);
        if (!isStoredInCorrectState) {
          maybeUserFromDatabase
            ? console.log(
                "Found user with permission, but user needs updating in DB",
                email,
                maybeUserFromDatabase
              )
            : console.log(
                "Found user with permission, but user not in DB",
                email
              );
        }
        return isStoredInCorrectState;
      })
    ) {
      console.log("NO PINBOARD PERMISSIONS CHANGED, exiting early");
      return;
    }

    const googleServiceAccountDetails = JSON.parse(
      await pinboardSecretPromiseGetter(
        `google/${STAGE === "PROD" ? "PROD" : "CODE"}/serviceAccountKey`
      )
    );

    const auth = new googleAuth.JWT({
      key: googleServiceAccountDetails.private_key,
      scopes: [
        "https://www.googleapis.com/auth/directory.readonly",
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/admin.directory.group.readonly",
        "https://www.googleapis.com/auth/admin.directory.group.member.readonly",
      ],
      email: googleServiceAccountDetails.client_email,
      subject: await pinboardSecretPromiseGetter("google/authSubject"),
    });

    const directoryService = googleAdminAPI({
      version: "directory_v1",
      auth,
    });

    const peopleService = googlePeopleAPI({
      version: "v1",
      auth,
    });

    const usersFromGoogleLookup = await buildUserLookupFromGoogle(
      directoryService,
      emailsOfUsersWithPinboardPermission
    );

    const photoUrlLookup = await buildPhotoUrlLookup(
      peopleService,
      Object.values(usersFromGoogleLookup).map(
        ({ googleID }) => `people/${googleID}`
      )
    );

    for (const email of emailsOfUsersWithPinboardPermission) {
      const maybeUserFromGoogle = usersFromGoogleLookup[email];
      const maybeUserFromDatabase = usersFromDatabaseLookup[email];

      if (maybeUserFromGoogle) {
        const maybeAvatarUrl =
          photoUrlLookup[`people/${maybeUserFromGoogle.googleID}`] || null;
        if (!maybeUserFromDatabase) {
          console.log(`Inserting details for user ${email}`);
          const user = { ...maybeUserFromGoogle, avatarUrl: maybeAvatarUrl };
          await sql`
            INSERT INTO "User" ${sql(user)}
          `.catch(handleUpsertError(user));
        } else if (
          maybeUserFromDatabase.isMentionable !==
            maybeUserFromGoogle.isMentionable ||
          maybeUserFromDatabase.firstName !== maybeUserFromGoogle.firstName ||
          maybeUserFromDatabase.lastName !== maybeUserFromGoogle.lastName ||
          maybeUserFromDatabase.googleID !== maybeUserFromGoogle.googleID ||
          maybeUserFromDatabase.avatarUrl !== maybeAvatarUrl // annoyingly these URLs often differ despite the image not changing - thanks Google!!
        ) {
          console.log(`Updating details for user ${email}`);
          await sql`
            UPDATE "User" 
            SET "avatarUrl" = ${maybeAvatarUrl},
                "isMentionable" = ${maybeUserFromGoogle.isMentionable},
                "firstName" = ${maybeUserFromGoogle.firstName},
                "lastName" = ${maybeUserFromGoogle.lastName},
                "googleID" = ${maybeUserFromGoogle.googleID}
            WHERE "email" = ${email}
          `.catch(handleUpsertError(maybeUserFromDatabase));
        }
      } else if (maybeUserFromDatabase?.isMentionable) {
        console.log(
          `User ${email} has been removed from Google, so marking as not mentionable and removing Google ID`
        );
        await sql`
                    UPDATE "User"
                    SET "isMentionable" = false, "googleID" = null
                    WHERE "email" = ${email}
                `.catch(handleUpsertError(maybeUserFromDatabase));
      } else if (maybeUserFromDatabase?.googleID) {
        console.log(
          `User ${email} has been removed from Google, so removing Google ID`
        );
        await sql`
                    UPDATE "User"
                    SET "googleID" = null
                    WHERE "email" = ${email}
                `.catch(handleUpsertError(maybeUserFromDatabase));
      } else if (!maybeUserFromDatabase) {
        console.log(`Inserting details for user ${email}`);
        const names = extractNamesWithFallback(email);
        const user = {
          googleID: null,
          avatarUrl: null,
          email,
          ...names,
          isMentionable: false,
        };
        await sql`
            INSERT INTO "User" ${sql(user)}
          `.catch(handleUpsertError(user));
      }
    }

    if (!isProcessPermissionChangesOnly) {
      const groupsToLookup = JSON.parse(
        await pinboardConfigPromiseGetter(
          `groups/${STAGE === "PROD" ? "PROD" : "CODE"}`
        )
      ) as GroupsToLookup;

      const groups = await getGroupDetailFromGoogle(
        directoryService,
        groupsToLookup
      );
      const groupMembers = await getGroupMembersFromGoogle(
        directoryService,
        groupsToLookup
      );

      await sql.begin((sql) => [
        sql`CREATE TABLE "Group_NEW"
                    (
                        LIKE "Group"
                    );`,
        sql`CREATE TABLE "GroupMember_NEW"
                    (
                        LIKE "GroupMember"
                    );`,
        ...groups.map((group) => {
          console.log(
            `Upserting Group '${group.shorthand}' (${group.primaryEmail})`
          );
          return sql`INSERT INTO "Group_NEW" ${sql(group)}`;
        }),
        ...groupMembers.map((groupMember) => {
          console.log(
            `Upserting Group Member ${groupMember.userGoogleID} into Group '${groupMember.groupShorthand}'`
          );
          return sql`INSERT INTO "GroupMember_NEW" ${sql(groupMember)}`;
        }),
        sql`DROP TABLE "GroupMember"`,
        sql`DROP TABLE "Group"`,
        sql`ALTER TABLE "Group_NEW" RENAME TO "Group"`,
        sql`ALTER TABLE "GroupMember_NEW" RENAME TO "GroupMember"`,
        sql`ALTER TABLE "Group" ADD PRIMARY KEY ("shorthand");`,
        sql`ALTER TABLE "GroupMember" ADD CONSTRAINT fk_group FOREIGN KEY ("groupShorthand") REFERENCES "Group"("shorthand");`,
        sql`CREATE INDEX "GroupMemberTableGroupShorthandIndex" ON "GroupMember"("groupShorthand");`,
        sql`CREATE INDEX "GroupMemberTableUserGoogleIdIndex" ON "GroupMember"("userGoogleID");`,
      ]);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
