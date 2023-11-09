import { Sql } from "../../../shared/database/types";
import { getBots } from "../services/chatBotBroker";

const fragmentUserWithoutPushSubscriptionSecrets = (sql: Sql) =>
  sql`"email", "firstName", "lastName", "avatarUrl", "isMentionable"`;

export const searchMentionableUsers = async (
  sql: Sql,
  args: { prefix: string }
) => {
  const usersPromise = sql`
    SELECT ${fragmentUserWithoutPushSubscriptionSecrets(sql)}
    FROM "User"
    WHERE "isMentionable" = true AND (
      "firstName" ILIKE ${args.prefix + "%"}
        OR "lastName" ILIKE ${args.prefix + "%"}
        OR CONCAT("firstName", ' ', "lastName") ILIKE ${args.prefix + "%"}
    )
    ORDER BY "webPushSubscription" IS NOT NULL DESC, "manuallyOpenedPinboardIds" IS NOT NULL DESC, "firstName" 
    LIMIT 5
  `;
  const groupsPromise = sql`
    SELECT "shorthand", "name", COALESCE((
        SELECT json_agg("email")
        FROM "User", "GroupMember"
        WHERE "shorthand" = "GroupMember"."groupShorthand"
        AND "GroupMember"."userGoogleID" = "User"."googleID"
        ), '[]') AS "memberEmails"
    FROM "Group"
    WHERE "shorthand" ILIKE ${"%" + args.prefix + "%"}
    OR "name" ILIKE ${"%" + args.prefix + "%"}
    OR "primaryEmail" ILIKE ${"%" + args.prefix + "%"}
    OR EXISTS(
        SELECT 1 
        FROM unnest("otherEmails") as "otherEmail"
        WHERE "otherEmail" ILIKE ${"%" + args.prefix + "%"}
    )
    ORDER BY "name"
    LIMIT 3
  `;
  const chatBotsPromise = (await getBots()).filter((chatBot) =>
    chatBot.shorthand.toLowerCase().includes(args.prefix.toLowerCase())
  );
  return {
    users: await usersPromise,
    groups: await groupsPromise,
    chatBots: await chatBotsPromise,
  };
};

export const getUsers = (sql: Sql, args: { emails: string[] }) =>
  sql`
      SELECT ${fragmentUserWithoutPushSubscriptionSecrets(sql)}
      FROM "User"
      WHERE "email" IN ${sql(args.emails)}
  `;

const fragmentMyUserWithoutPushSubscriptionSecrets = (sql: Sql) =>
  sql`"email", "firstName", "lastName", "avatarUrl", "manuallyOpenedPinboardIds", "visitedTourSteps" IS NOT NULL AS "hasEverUsedTour", "webPushSubscription" IS NOT NULL AS "hasWebPushSubscription"`;

export const getMyUser = (sql: Sql, userEmail: string) =>
  sql`
    SELECT ${fragmentMyUserWithoutPushSubscriptionSecrets(sql)}
    FROM "User"
    WHERE "email" = ${userEmail}
`.then((rows) => rows[0]);

export const setWebPushSubscriptionForUser = async (
  sql: Sql,
  args: { webPushSubscription: unknown },
  userEmail: string
) =>
  sql`
    UPDATE "User" 
    SET "webPushSubscription" = ${args.webPushSubscription}
    WHERE "email" = ${userEmail}
    RETURNING ${fragmentMyUserWithoutPushSubscriptionSecrets(sql)}
`.then((rows) => rows[0]);

export const addManuallyOpenedPinboardIds = async (
  sql: Sql,
  args: { maybeEmailOverride?: string; pinboardId: string },
  userEmail: string
) =>
  sql`
    UPDATE "User" 
    SET "manuallyOpenedPinboardIds" = ARRAY_APPEND(ARRAY_REMOVE("manuallyOpenedPinboardIds", ${
      args.pinboardId
    }), ${args.pinboardId})
    WHERE "email" = ${args.maybeEmailOverride || userEmail}
    RETURNING ${fragmentMyUserWithoutPushSubscriptionSecrets(sql)}
`.then((rows) => rows[0]);

export const removeManuallyOpenedPinboardIds = async (
  sql: Sql,
  args: { pinboardIdToClose: string },
  userEmail: string
) =>
  sql`
    UPDATE "User" 
    SET "manuallyOpenedPinboardIds" = ARRAY_REMOVE("manuallyOpenedPinboardIds", ${
      args.pinboardIdToClose
    })
    WHERE "email" = ${userEmail}
    RETURNING ${fragmentMyUserWithoutPushSubscriptionSecrets(sql)}
`.then((rows) => rows[0]);

export const visitTourStep = async (
  sql: Sql,
  args: { tourStepId: string },
  userEmail: string
) =>
  sql`
    UPDATE "User"
    SET "visitedTourSteps" = jsonb_set(
        COALESCE("visitedTourSteps", '{}'::jsonb), 
        ${[args.tourStepId]}, 
        to_jsonb(true), 
        true
    )
    WHERE "email" = ${userEmail}
    RETURNING ${fragmentMyUserWithoutPushSubscriptionSecrets(sql)}
`.then((rows) => rows[0]);
