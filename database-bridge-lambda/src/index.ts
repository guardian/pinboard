import type {
  AppSyncIdentityLambda,
  AppSyncResolverEvent,
} from "aws-lambda/trigger/appsync-resolver";
import {
  claimItem,
  createItem,
  getGroupPinboardIds,
  getItemCounts,
  getUniqueUsersPerHourInRange,
  listItems,
} from "./sql/Item";
import { Sql } from "../../shared/database/types";
import { listLastItemSeenByUsers, seenItem } from "./sql/LastItemSeenByUser";
import {
  addManuallyOpenedPinboardIds,
  getMyUser,
  getUsers,
  removeManuallyOpenedPinboardIds,
  searchMentionableUsers,
  setWebPushSubscriptionForUser,
} from "./sql/User";
import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { DatabaseOperation } from "../../shared/graphql/operations";
import { GrafanaRequest } from "bootstrapping-lambda/src/reporting/grafanaType";

const run = (
  sql: Sql,
  databaseOperation: DatabaseOperation,
  args: never,
  userEmail: string
) => {
  switch (databaseOperation) {
    case "createItem":
      return createItem(sql, args, userEmail);
    case "claimItem":
      return claimItem(sql, args, userEmail);
    case "listItems":
      return listItems(sql, args, userEmail);
    case "seenItem":
      return seenItem(sql, args, userEmail);
    case "listLastItemSeenByUsers":
      return listLastItemSeenByUsers(sql, args);
    case "searchMentionableUsers":
      return searchMentionableUsers(sql, args);
    case "getUsers":
      return getUsers(sql, args);
    case "getMyUser":
      return getMyUser(sql, userEmail);
    case "setWebPushSubscriptionForUser":
      return setWebPushSubscriptionForUser(sql, args, userEmail);
    case "addManuallyOpenedPinboardIds":
      return addManuallyOpenedPinboardIds(sql, args, userEmail);
    case "removeManuallyOpenedPinboardIds":
      return removeManuallyOpenedPinboardIds(sql, args, userEmail);
    case "getGroupPinboardIds":
      return getGroupPinboardIds(sql, userEmail);
    case "getItemCounts":
      return getItemCounts(sql, args, userEmail);
    case "getUniqueUsersPerHourInRange":
      return getUniqueUsersPerHourInRange(sql, args);
  }

  throw Error(
    `No handler for '${databaseOperation}' operation. @typescript-eslint/switch-exhaustiveness-check should have caught this`
  );
};

const isGrafanaRequest = (
  maybeGrafanaRequest: unknown
): maybeGrafanaRequest is GrafanaRequest => {
  return (
    typeof maybeGrafanaRequest === "object" &&
    maybeGrafanaRequest !== null &&
    "targets" in maybeGrafanaRequest
  );
};

export const handler = async (
  payload: AppSyncResolverEvent<unknown, unknown>
) => {
  if (isGrafanaRequest(payload)) {
    return "targets";
  }

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
