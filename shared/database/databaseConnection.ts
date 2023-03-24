import { standardAwsConfig } from "../awsIntegration";
import postgres from "postgres";
import { DATABASE_PORT, DATABASE_USERNAME, DATABASE_NAME } from "./database";
import { getEnvironmentVariableOrThrow } from "../environmentVariables";
import { Signer } from "@aws-sdk/rds-signer";

export async function getDatabaseConnection() {
  const isRunningLocally = !process.env.LAMBDA_TASK_ROOT;

  const databaseHostname = getEnvironmentVariableOrThrow("databaseHostname");

  const basicConnectionDetails = {
    hostname: databaseHostname,
    port: DATABASE_PORT,
    username: DATABASE_USERNAME,
  };

  const iamToken = await new Signer({
    ...standardAwsConfig,
    ...basicConnectionDetails,
  }).getAuthToken();

  isRunningLocally &&
    console.log(
      `\nIAM Token to use as DB password (if you want to connect from command line, IntelliJ etc.)\n${iamToken}\n`
    );

  return postgres({
    ...basicConnectionDetails,
    hostname: isRunningLocally ? "localhost" : databaseHostname,
    database: DATABASE_NAME,
    password: iamToken,
    ssl: "require",
  });
}
