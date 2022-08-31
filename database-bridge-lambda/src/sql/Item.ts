import { CreateItemInput } from "../../../shared/graphql/graphql";
import { Sql } from "./types";

export const createItem = async (
  sql: Sql,
  args: { input: CreateItemInput },
  userEmail: string
) =>
  sql`
    INSERT INTO "Item" ${sql({ userEmail, ...args.input })} 
    RETURNING *
`.then((rows) => rows[0]);

export const listItems = (sql: Sql, args: { pinboardId: string }) => sql`
    SELECT *
    FROM "Item"
    WHERE "pinboardId" = ${args.pinboardId}
`;
