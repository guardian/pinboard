import { IS_RUNNING_LOCALLY, standardAwsConfig } from "../awsIntegration";
import postgres from "postgres";
import { DATABASE_PORT, DATABASE_USERNAME, DATABASE_NAME } from "./database";
import { getEnvironmentVariableOrThrow } from "../environmentVariables";
import { Signer } from "@aws-sdk/rds-signer";

const TEN_MINS_IN_MILLIS = 10 * 60 * 1000;

interface TimestampedConnectionPool {
  // eslint-disable-next-line @typescript-eslint/ban-types
  sql: postgres.Sql<{}>;
  createdAt: number; // epoch millis
}

let maybeConnectionPool: TimestampedConnectionPool | null = null;

export async function getDatabaseConnection() {
  const now = Date.now();
  const tenMinsAgoEpochMillis = now - TEN_MINS_IN_MILLIS;
  if (
    maybeConnectionPool &&
    maybeConnectionPool.createdAt > tenMinsAgoEpochMillis
  ) {
    console.log(
      `Reusing existing database connection (${
        (now - maybeConnectionPool.createdAt) / 1000
      } seconds old)`
    );
    return maybeConnectionPool.sql;
  } else if (maybeConnectionPool) {
    console.log(
      "Existing connection pool older than 10mins, closing before creating a fresh pool..."
    );
    await maybeConnectionPool.sql.end();
  }

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

  maybeConnectionPool = {
    sql: postgres({
      ...basicConnectionDetails,
      hostname: IS_RUNNING_LOCALLY ? "localhost" : databaseHostname,
      database: DATABASE_NAME,
      password: iamToken,
      ssl: "require",
      onclose: (connectionNumber) =>
        console.log(`Connection (#${connectionNumber}) closed`),
      idle_timeout: 60, // seconds
    }),
    createdAt: Date.now(),
  };

  console.log("Created new database connection pool");

  return maybeConnectionPool.sql;
}
