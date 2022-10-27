import { Sql } from "../../../shared/database/types";
import { LastItemSeenByUserInput } from "../../../shared/graphql/graphql";

export const seenItem = async (
  sql: Sql,
  args: { input: LastItemSeenByUserInput },
  userEmail: string
) =>
  sql`
    INSERT INTO "LastItemSeenByUser"("pinboardId", "itemID", "userEmail", "seenAt")
    VALUES (${args.input.pinboardId}, ${args.input.itemID}, ${userEmail}, current_timestamp)
    ON CONFLICT ("pinboardId", "userEmail") DO UPDATE SET "itemID"=${args.input.itemID}, "seenAt" = current_timestamp
    RETURNING *
`.then((rows) => rows[0]);

export const listLastItemSeenByUsers = (
  sql: Sql,
  args: { pinboardId: string }
) => sql`
    SELECT *
    FROM "LastItemSeenByUser"
    WHERE "pinboardId" = ${args.pinboardId}
`;
