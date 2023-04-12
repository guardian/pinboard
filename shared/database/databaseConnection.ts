import { IS_RUNNING_LOCALLY, standardAwsConfig } from "../awsIntegration";
import postgres from "postgres";
import { DATABASE_PORT, DATABASE_USERNAME, DATABASE_NAME } from "./database";
import { getEnvironmentVariableOrThrow } from "../environmentVariables";
import { Signer } from "@aws-sdk/rds-signer";

export async function getDatabaseConnection() {
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

  IS_RUNNING_LOCALLY &&
    console.log(
      `\nIAM Token to use as DB password (if you want to connect from command line, IntelliJ etc.)\n${iamToken}\n`
    );

  return postgres({
    ...basicConnectionDetails,
    hostname: IS_RUNNING_LOCALLY ? "localhost" : databaseHostname,
    database: DATABASE_NAME,
    password: iamToken,
    ssl: "require",
  });
}
