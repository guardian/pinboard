import { Sql } from "../../../shared/database/types";

const fragmentUserWithoutPushSubscriptionSecrets = (sql: Sql) =>
  sql`"email", "firstName", "lastName", "avatarUrl", "isMentionable"`;

export const listUsers = (sql: Sql) => sql`
    SELECT ${fragmentUserWithoutPushSubscriptionSecrets(sql)}
    FROM "User"
    ORDER BY "isMentionable" DESC, "manuallyOpenedPinboardIds" IS NOT NULL DESC, "webPushSubscription" IS NOT NULL DESC
    LIMIT 25
`;

export const searchMentionableUsers = (sql: Sql, args: { prefix: string }) =>
  sql`
    SELECT ${fragmentUserWithoutPushSubscriptionSecrets(sql)}
    FROM "User"
    WHERE "isMentionable" = true AND (
      "firstName" ILIKE ${args.prefix + "%"}
        OR "lastName" ILIKE ${args.prefix + "%"}
    )
    ORDER BY "firstName"
    LIMIT 5
`;

export const getUsers = (sql: Sql, args: { emails: string[] }) =>
  sql`
      SELECT ${fragmentUserWithoutPushSubscriptionSecrets(sql)}
      FROM "User"
      WHERE "email" IN ${sql(args.emails)}
  `;

const fragmentMyUserWithoutPushSubscriptionSecrets = (sql: Sql) =>
  sql`"email", "firstName", "lastName", "avatarUrl", "manuallyOpenedPinboardIds", "webPushSubscription" IS NOT NULL AS "hasWebPushSubscription"`;

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
