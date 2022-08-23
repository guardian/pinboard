import { Sql } from "./types";

export const listItems = (
  sql: Sql,
  args: { filter: { pinboardId: { eq: string } } } // TODO eliminate this nested filter thing once off dynamo
) => sql`
    SELECT *
    FROM Item
    WHERE pinboardId = ${args.filter.pinboardId.eq}
`;
