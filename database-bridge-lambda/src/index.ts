import type {
  AppSyncIdentityLambda,
  AppSyncResolverEvent,
} from "aws-lambda/trigger/appsync-resolver";
import {
  claimItem,
  createItem,
  deleteItem,
  dismissItem,
  editItem,
  getGroupPinboardIds,
  getItemCounts,
  listItems,
} from "./sql/Item";
import { Sql } from "../../shared/database/types";
import { listLastItemSeenByUsers, seenItem } from "./sql/LastItemSeenByUser";
import {
  addManuallyOpenedPinboardIds,
  changeFeatureFlag,
  getMyUser,
  getUsers,
  removeManuallyOpenedPinboardIds,
  searchMentionableUsers,
  setWebPushSubscriptionForUser,
  visitTourStep,
} from "./sql/User";
import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { DatabaseOperation } from "../../shared/graphql/operations";
import { MetricRequest } from "../../shared/types/grafanaType";
import { getMetrics } from "./services/grafanaReportingService";

const run = (
  sql: Sql,
  databaseOperation: DatabaseOperation,
  args: never,
  userEmail: string
) => {
  switch (databaseOperation) {
    case "createItem":
      return createItem(sql, args, userEmail);
    case "editItem":
      return editItem(sql, args, userEmail);
    case "dismissItem":
      return dismissItem(sql, args, userEmail);
    case "deleteItem":
      return deleteItem(sql, args, userEmail);
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
    case "visitTourStep":
      return visitTourStep(sql, args, userEmail);
    case "changeFeatureFlag":
      return changeFeatureFlag(sql, args, userEmail);
  }

  throw Error(
    `No handler for '${databaseOperation}' operation. @typescript-eslint/switch-exhaustiveness-check should have caught this`
  );
};

const isMetricRequest = (
  maybeMetricRequest: MetricRequest | AppSyncResolverEvent<unknown, unknown>
): maybeMetricRequest is MetricRequest =>
  (maybeMetricRequest as MetricRequest).range !== undefined;

export const handler = async (
  payload: MetricRequest | AppSyncResolverEvent<unknown, unknown>
) => {
  const sql = await getDatabaseConnection();
  if (isMetricRequest(payload)) {
    console.log("metric payload", payload);
    return await getMetrics(sql, payload);
  } else {
    const args = payload.arguments as never;
    const userEmail: string = (payload.identity as AppSyncIdentityLambda)
      .resolverContext.userEmail;
    const databaseOperation = payload.info.fieldName as DatabaseOperation;

    console.log("AppSync request:", {
      userEmail,
      databaseOperation,
      referrer: payload?.request?.headers?.referer,
    });
    return await run(sql, databaseOperation, args, userEmail);
  }
};
