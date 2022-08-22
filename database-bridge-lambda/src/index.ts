import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import postgres from "postgres";
import {
  DATABASE_NAME,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "../../shared/database";

interface HandlerPayload {
  field: string; // TODO use proper type
  arguments: Record<string, any>;
}

export const handler = async ({ field }: HandlerPayload) => {
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

  switch (field) {
    case "listItems":
      return sql`SELECT 'Hello World'`;
  }

  throw Error(`No handler for '${field}' operation.`);
};
