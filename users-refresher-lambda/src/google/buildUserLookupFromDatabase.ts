import { Sql } from "../../../shared/database/types";
import { User, UserLookup } from "../util";

export const buildUserLookupFromDatabase = (sql: Sql): Promise<UserLookup> =>
  sql`SELECT * FROM "User"`.then((users) =>
    users.reduce(
      (acc, userRow) => ({ ...acc, [userRow.email]: userRow as User }),
      {} as UserLookup
    )
  );
