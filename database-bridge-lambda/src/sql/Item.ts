import {
  ADMIN_PERMISSION,
  userHasPermission,
} from "../../../shared/permissions";
import {
  CreateItemInput,
  EditItemInput,
  Item,
  PinboardIdWithClaimCounts,
} from "../../../shared/graphql/graphql";
import { Sql } from "../../../shared/database/types";
import { Range } from "../../../shared/types/grafanaType";

const fragmentIndividualMentionsToMentionHandles = (
  sql: Sql,
  userEmail: string
) => sql`
    SELECT json_agg(
                   json_build_object(
                           'label', concat('@', "firstName", ' ', "lastName"),
                           'isMe', "email" = ${userEmail}
                       )
               )
    FROM "User"
    WHERE "email" = ANY ("mentions")
`;

const fragmentGroupMentionsToMentionHandles = (
  sql: Sql,
  userEmail: string
) => sql`
    SELECT json_agg(
                   json_build_object(
                           'label', concat('@', "shorthand"),
                           'isMe', EXISTS(
                                   SELECT 1
                                   FROM "User",
                                        "GroupMember"
                                   WHERE "GroupMember"."groupShorthand" = "shorthand"
                                     AND "GroupMember"."userGoogleID" = "User"."googleID"
                                     AND "User"."email" = ${userEmail}
                               )
                       )
               )
    FROM "Group"
    WHERE "shorthand" = ANY ("groupMentions")
`;

const fragmentItemFields = (sql: Sql, userEmail: string) => sql`
    *, (
    ${fragmentIndividualMentionsToMentionHandles(sql, userEmail)}
    )
    as
    "mentions",
    (
    ${fragmentGroupMentionsToMentionHandles(sql, userEmail)}
    )
    as
    "groupMentions"`;

export const createItem = async (
  sql: Sql,
  args: { input: CreateItemInput },
  userEmail: string
) =>
  sql`
        INSERT INTO "Item" ${sql({ userEmail, ...args.input })}
            RETURNING ${fragmentItemFields(sql, userEmail)}
    `.then((rows) => rows[0]);

export const editItem = async (
  sql: Sql,
  args: { itemId: string; input: EditItemInput },
  userEmail: string
) =>
  sql`
        UPDATE "Item"
        SET 
            ${sql(args.input)},
            "editHistory" = ARRAY_APPEND("editHistory", now())
        WHERE "id" = ${args.itemId}
          AND "userEmail" = ${userEmail}
        RETURNING ${fragmentItemFields(sql, userEmail)}
    `.then((rows) => rows[0]);

export const deleteItem = async (
  sql: Sql,
  args: { itemId: string },
  userEmail: string
) => {
  const userMayDeleteAnyMessage = await userHasPermission(
    userEmail,
    ADMIN_PERMISSION
  );
  // normally we check the item's author is the same as the user deleting to prevent deleting
  // other users' items. But admins are allowed to do exactly that, so drop the condition.
  const fragmentIdentityCheck = userMayDeleteAnyMessage
    ? sql``
    : sql`AND "userEmail" = ${userEmail}`;
  return sql`
      UPDATE "Item"
      SET
          "message" = NULL,
          "payload" = NULL,
          "deletedAt" = now()
      WHERE "id" = ${args.itemId}
         ${fragmentIdentityCheck}
      RETURNING ${fragmentItemFields(sql, userEmail)}
    `.then((rows) => rows[0]);
};

export const listItems = (
  sql: Sql,
  args: { pinboardId: string; maybeAspectRatioFilter?: string },
  userEmail: string
) => sql`
    SELECT ${fragmentItemFields(sql, userEmail)}
    FROM "Item"
    WHERE "pinboardId" = ${args.pinboardId}
      AND "isArchived" = false
    ${
      args.maybeAspectRatioFilter
        ? sql`AND "type" = 'grid-crop' AND  "payload" ->> 'aspectRatio' = ${args.maybeAspectRatioFilter}`
        : sql``
    }
`;

export const claimItem = (
  sql: Sql,
  args: { itemId: string },
  userEmail: string
) =>
  sql.begin(async (sql) => {
    const [updatedItem]: Item[] = await sql`
            UPDATE "Item"
            SET "claimedByEmail" = ${userEmail}
            WHERE "id" = ${args.itemId}
              AND "claimedByEmail" IS NULL
            RETURNING ${fragmentItemFields(sql, userEmail)}
        `;
    if (!updatedItem) {
      throw new Error("Item already claimed or item not found");
    }
    const claimItemToInsert = {
      type: "claim",
      userEmail,
      pinboardId: updatedItem.pinboardId,
      relatedItemId: args.itemId,
      groupMentions:
        updatedItem.groupMentions?.map(
          (_) => _.label.substring(1) // strip the preceding @ (to get back to just the shorthand)
        ) || null,
    };
    const [newItem] = await sql`
            INSERT INTO "Item" ${sql(claimItemToInsert)}
                RETURNING ${fragmentItemFields(sql, userEmail)}
        `;
    return {
      pinboardId: updatedItem.pinboardId,
      updatedItem,
      newItem,
    };
  });

export const getGroupPinboardIds = async (
  sql: Sql,
  userEmail: string
): Promise<PinboardIdWithClaimCounts[]> =>
  sql`
        SELECT "pinboardId",
               (CASE
                    WHEN "claimable" = false THEN 'notClaimableCount'
                    WHEN "claimedByEmail" IS NULL THEN 'unclaimedCount'
                    WHEN "claimedByEmail" = ${userEmail} THEN 'yourClaimedCount'
                    ELSE 'othersClaimedCount'
                   END)  as "countType",
               count(*)  as "count",
               MAX("id") as "latestGroupMentionItemId",
               NOT EXISTS(
                       SELECT 1
                       FROM "LastItemSeenByUser"
                       WHERE "LastItemSeenByUser"."pinboardId" = "Item"."pinboardId"
                         AND "LastItemSeenByUser"."userEmail" = ${userEmail}
                         AND "LastItemSeenByUser"."itemID" >= MAX("Item"."id")
                   )     as "hasUnread"
        FROM "Item"
        WHERE "type" != 'claim'
          AND "isArchived" = false
          AND "deletedAt" IS NULL
          AND EXISTS(
                SELECT 1
                FROM "User"
                         INNER JOIN "GroupMember" ON "GroupMember"."userGoogleID" = "User"."googleID"
                WHERE "GroupMember"."groupShorthand" = ANY ("groupMentions")
                  AND "User"."email" = ${userEmail}
            )
        GROUP BY "pinboardId", "countType"
    `.then((rows) =>
    Object.values(
      rows.reduce((acc, row) => {
        const isRowUnclaimedOrInformational =
          ["unclaimedCount", "notClaimableCount"].includes(row.countType) &&
          row.count > 0;

        return {
          ...acc,
          [row.pinboardId]: {
            ...(acc[row.pinboardId] || {
              pinboardId: row.pinboardId,
              unclaimedCount: 0,
              yourClaimedCount: 0,
              othersClaimedCount: 0,
              notClaimableCount: 0,
            }),
            [row.countType]: row.count,
            latestGroupMentionItemId: acc[row.pinboardId]
              ? Math.max(
                  row.latestGroupMentionItemId,
                  acc[row.pinboardId].latestGroupMentionItemId
                )
              : row.latestGroupMentionItemId,
            hasUnread: acc[row.pinboardId]?.hasUnread
              ? true
              : isRowUnclaimedOrInformational && row.hasUnread,
          },
        };
      }, {} as Record<string, PinboardIdWithClaimCounts>)
    )
  );

export const getItemCounts = (
  sql: Sql,
  args: { pinboardIds: string[] },
  userEmail: string
) =>
  args.pinboardIds.length === 0
    ? Promise.resolve([])
    : sql`
                SELECT "pinboardId",
                       COUNT(*) AS "totalCount",
                       COUNT(*) FILTER (WHERE "id" > COALESCE((SELECT "itemID"
                                                               FROM "LastItemSeenByUser"
                                                               WHERE "LastItemSeenByUser"."pinboardId" = "Item"."pinboardId"
                                                                 AND "LastItemSeenByUser"."userEmail" = ${userEmail}),
                                                              0)) AS "unreadCount",
                       COUNT(*) FILTER (WHERE "type" = 'grid-crop') AS "totalCropCount",
                       COUNT(*) FILTER (WHERE "type" = 'grid-crop' AND "payload" ->> 'aspectRatio' = '5:4') AS "fiveByFourCount",
                       COUNT(*) FILTER (WHERE "type" = 'grid-crop' AND "payload" ->> 'aspectRatio' = '4:5') AS "fourByFiveCount"
                FROM "Item"
                WHERE "pinboardId" IN ${sql(args.pinboardIds)}
                  AND "deletedAt" IS NULL
                  AND "isArchived" = false
                GROUP BY "pinboardId"
        `;

export const getUniqueUsersPerHourInRange = async (
  sql: Sql,
  range: Range
): Promise<[number, number][]> =>
  sql`
        SELECT DATE_TRUNC('hour', "timestamp") as "hour",
               COUNT(DISTINCT "userEmail")     as "uniqueUsers"
        FROM "Item"
        WHERE "timestamp" >= ${range.from}
          AND "timestamp" < ${range.to}
        GROUP BY "hour"
    `.then((rows) =>
    rows.map((row) => [parseInt(row.uniqueUsers), row.hour.getTime()])
  );
