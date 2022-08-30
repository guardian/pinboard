import { Sql } from "./types";
import { LastItemSeenByUserInput } from "../../../shared/graphql/graphql";

export const seenItem = async (
  sql: Sql,
  args: { input: LastItemSeenByUserInput },
  userEmail: string
) =>
  sql`
    INSERT INTO LastItemSeenByUser("pinboardId", "itemID", "userEmail", "seenAt")
    VALUES (${args.input.pinboardId}, ${args.input.itemID}, ${userEmail}, current_timestamp)
    ON CONFLICT ("pinboardId", "itemID", "userEmail") DO UPDATE SET "seenAt" = current_timestamp
    RETURNING *
`.then((rows) => rows[0]);

export const listLastItemSeenByUsers = (
  sql: Sql,
  args: { pinboardId: string }
) => sql`
    SELECT *
    FROM LastItemSeenByUser
    WHERE "pinboardId" = ${args.pinboardId}
`;
