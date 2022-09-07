import type {
  AppSyncIdentityLambda,
  AppSyncResolverEvent,
} from "aws-lambda/trigger/appsync-resolver";
import type { Mutation, Query } from "../../shared/graphql/graphql";
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

type FieldName = keyof Required<Omit<Query & Mutation, "__typename">>;

const run = (
  sql: Sql,
  fieldName: FieldName,
  args: never,
  userEmail: string
) => {
  switch (fieldName) {
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
    // FIXME remove default case once RDS migration is complete, so @typescript-eslint/switch-exhaustiveness-check can do its job
    default:
      throw Error(`Handler for '${fieldName}' not yet implemented`);
  }

  throw Error(
    `No handler for '${fieldName}' operation. @typescript-eslint/switch-exhaustiveness-check should have caught this`
  );
};

export const handler = async (
  payload: AppSyncResolverEvent<unknown, unknown>
) => {
  const sql = await getDatabaseConnection();
  const args = payload.arguments as never;
  const userEmail: string = (payload.identity as AppSyncIdentityLambda)
    .resolverContext.userEmail;
  const fieldName = payload.info.fieldName as FieldName;

  try {
    return await run(sql, fieldName, args, userEmail);
  } finally {
    await sql.end();
  }
};
