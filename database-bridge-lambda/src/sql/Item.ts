import { CreateItemInput } from "../../../shared/graphql/graphql";
import { Sql } from "../../../shared/database/types";

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

export const listItems = (
  sql: Sql,
  args: { pinboardId: string },
  userEmail: string
) => sql`
    SELECT ${fragmentItemFields(sql, userEmail)}
    FROM "Item"
    WHERE "pinboardId" = ${args.pinboardId}
`;

export const claimItem = (
  sql: Sql,
  args: { itemId: string },
  userEmail: string
) =>
  sql.begin(async (sql) => {
    const [updatedItem] = await sql`
        UPDATE "Item"
        SET "claimedByEmail" = ${userEmail}
        WHERE "id" = ${args.itemId} AND "claimedByEmail" IS NULL
        RETURNING ${fragmentItemFields(sql, userEmail)}
    `;
    if (!updatedItem) {
      throw new Error("Item already claimed or item not found");
    }
    const [newItem] = await sql`
        INSERT INTO "Item" ("type", "userEmail", "pinboardId", "relatedItemId")
        VALUES ('claim', ${userEmail}, ${updatedItem.pinboardId}, ${
      args.itemId
    })
        RETURNING ${fragmentItemFields(sql, userEmail)}
    `;
    return {
      updatedItem,
      newItem,
    };
  });
