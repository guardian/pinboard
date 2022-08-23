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
import { listItems } from "./sql/listItems";
import { createItem } from "./sql/createItem";
import { Sql } from "./sql/types";
import { CreateItemInput } from "../../shared/graphql/graphql";

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
  const basicConnectionDetails = {
    hostname: getEnvironmentVariableOrThrow("databaseHostname"),
    port: DATABASE_PORT,
    username: DATABASE_USERNAME,
  };

  const iamToken = new AWS.RDS.Signer({
    ...standardAwsConfig,
    credentials: await standardAwsConfig.credentialProvider.resolvePromise(),
  }).getAuthToken(basicConnectionDetails);

  const sql = postgres({
    ...basicConnectionDetails,
    database: DATABASE_NAME,
    password: iamToken,
    ssl: "require",
  });

  const args = payload.arguments as never;
  const userEmail: string = (payload.identity as AppSyncIdentityLambda)
    .resolverContext.userEmail;
  const fieldName = payload.info.fieldName as FieldName;

  const result = await run(sql, fieldName, args, userEmail);

  await sql.end();

  return result;
};
