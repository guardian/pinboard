import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import postgres from "postgres";
import {
  DATABASE_NAME,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "../../shared/database";
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
  const isRunningLocally = !process.env.LAMBDA_TASK_ROOT;

  const databaseHostname = getEnvironmentVariableOrThrow("databaseHostname");

  const basicConnectionDetails = {
    hostname: databaseHostname,
    port: DATABASE_PORT,
    username: DATABASE_USERNAME,
  };

  const iamToken = new AWS.RDS.Signer({
    ...standardAwsConfig,
    credentials: await standardAwsConfig.credentialProvider.resolvePromise(),
  }).getAuthToken(basicConnectionDetails);

  isRunningLocally &&
    console.log(
      `\nIAM Token to use as DB password (if you want to connect from command line, IntelliJ etc.)\n${iamToken}\n`
    );

  const sql = postgres({
    ...basicConnectionDetails,
    hostname: isRunningLocally ? "localhost" : databaseHostname,
    database: DATABASE_NAME,
    password: iamToken,
    ssl: "require",
  });

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
