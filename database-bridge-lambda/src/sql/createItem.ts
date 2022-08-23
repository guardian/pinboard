import { CreateItemInput } from "../../../shared/graphql/graphql";
import { Sql } from "./types";

export const createItem = (
  sql: Sql,
  args: CreateItemInput,
  userEmail: string
) => sql`
    INSERT 

`;
