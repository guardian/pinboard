import { CreateItemInput } from "../../../shared/graphql/graphql";
import { Sql } from "./types";

export const createItem = (
  sql: Sql,
  args: CreateItemInput,
  userEmail: string
) => sql`
    INSERT INTO Item ${sql({ userEmail, ...args })} 
`;

export const listItems = (sql: Sql, args: { pinboardId: string }) => sql`
    SELECT *
    FROM Item
    WHERE "pinboardId" = ${args.pinboardId}
`;
