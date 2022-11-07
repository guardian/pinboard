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
    WHERE "email" = ANY("mentions")
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
                FROM "User", "GroupMember"
                WHERE "GroupMember"."groupShorthand" = "shorthand"
                    AND "GroupMember"."userGoogleID" = "User"."googleID"
                    AND "User"."email" = ${userEmail} 
            )
        )
    )
    FROM "Group"
    WHERE "shorthand" = ANY("groupMentions")
`;

const fragmentItemFields = (sql: Sql, userEmail: string) => sql`
    *, (${fragmentIndividualMentionsToMentionHandles(
      sql,
      userEmail
    )}) as "mentions", (${fragmentGroupMentionsToMentionHandles(
  sql,
  userEmail
)}) as "groupMentions"`;

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
