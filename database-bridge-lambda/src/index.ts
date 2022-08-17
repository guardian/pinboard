import type {
  AppSyncIdentityLambda,
  AppSyncResolverEvent,
} from "aws-lambda/trigger/appsync-resolver";
import { createItem, listItems } from "./sql/Item";
import { Sql } from "./sql/types";
import { listLastItemSeenByUsers, seenItem } from "./sql/LastItemSeenByUser";
import {
  addManuallyOpenedPinboardIds,
  getMyUser,
  listUsers,
  removeManuallyOpenedPinboardIds,
  setWebPushSubscriptionForUser,
} from "./sql/User";
import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { DatabaseOperation } from "../../shared/graphql/operations";

const run = (
  sql: Sql,
  databaseOperation: DatabaseOperation,
  args: never,
  userEmail: string
) => {
  switch (databaseOperation) {
    case "createItem":
      return createItem(sql, args, userEmail);
    case "listItems":
      return listItems(sql, args);
    case "seenItem":
      return seenItem(sql, args, userEmail);
    case "listLastItemSeenByUsers":
      return listLastItemSeenByUsers(sql, args);
    case "listUsers":
      return listUsers(sql);
    case "getMyUser":
      return getMyUser(sql, userEmail);
    case "setWebPushSubscriptionForUser":
      return setWebPushSubscriptionForUser(sql, args, userEmail);
    case "addManuallyOpenedPinboardIds":
      return addManuallyOpenedPinboardIds(sql, args, userEmail);
    case "removeManuallyOpenedPinboardIds":
      return removeManuallyOpenedPinboardIds(sql, args, userEmail);
  }

  throw Error(
    `No handler for '${databaseOperation}' operation. @typescript-eslint/switch-exhaustiveness-check should have caught this`
  );
};

export const handler = async (
  payload: AppSyncResolverEvent<unknown, unknown>
) => {
  const sql = await getDatabaseConnection();
  const args = payload.arguments as never;
  const userEmail: string = (payload.identity as AppSyncIdentityLambda)
    .resolverContext.userEmail;
  const databaseOperation = payload.info.fieldName as DatabaseOperation;

  try {
    return await run(sql, databaseOperation, args, userEmail);
  } finally {
    await sql.end();
  }
};
