import AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import postgres from "postgres";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { getDatabaseProxyName, DATABASE_PORT, DATABASE_NAME, DATABASE_USERNAME } from "../../shared/database";
import { ENVIRONMENT_VARIABLE_KEYS, getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { establishTunnelToDBProxy, isThereExistingTunnel } from "../local/establishTunnel";
import { getJumpHost } from "../local/getJumpHost";
import { Sql } from "../src/sql/types";


const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);
  
export async function getUsersToMigrate():Promise<object[]> {
    const getStoredUsers = async (
        startKey?: DocumentClient.Key
      ): Promise<object[]> => {
        const userResults = await dynamo
          .scan({
            TableName: "pinboard-CODE-pinboardusertable2621B03F-16NOYN7UMQ1RS",
            ExclusiveStartKey: startKey,
          })
          .promise();
    
        const storedUsers =
          userResults.Items || [];
    
        if (userResults.LastEvaluatedKey) {
          return [
            ...storedUsers,
            ...(await getStoredUsers(userResults.LastEvaluatedKey)),
          ];
        } else {
          return storedUsers;
        }
      };

      const storedUsers = await getStoredUsers();
      return storedUsers;
}

export async function getItemsToMigrate():Promise<object[]> {
    const getStoredItems = async (
        startKey?: DocumentClient.Key
      ): Promise<object[]> => {
        const itemsResults = await dynamo
          .scan({
            TableName: "pinboard-CODE-pinboarditemtable83382753-1QVZDRAX9CZ3I",
            ExclusiveStartKey: startKey,
          })
          .promise();
    
        const items =
          itemsResults.Items || [];
    
        if (itemsResults.LastEvaluatedKey) {
          return [
            ...items,
            ...(await getStoredItems(itemsResults.LastEvaluatedKey)),
          ];
        } else {
          return items;
        }
      };

      const storedUsers = await getStoredItems();
      return storedUsers;
}



export async function migrateUsers(sql: Sql) {
    const users = await getUsersToMigrate();
    console.log("NUMBER TO WRITE", users.length);
    //@ts-ignore
    return Promise.allSettled(users.map(({ ttlEpochSeconds, manuallyOpenedPinboardIds, ...user }) => 
    sql`
        INSERT INTO "User" ${sql({ ...user, manuallyOpenedPinboardIds: manuallyOpenedPinboardIds?.values || null })}`
    ));
};

export async function migrateItems(sql: Sql) {
    const items = await getItemsToMigrate();
    //@ts-ignore
    items.sort((a, b) => a.timestamp - b.timestamp);
    console.log("NUMBER TO WRITE", items.length);
    //@ts-ignore
    for (const { id, timestamp, user, seenBy, ...item } of items) {
        //@ts-ignore
        if (!item.userEmail) continue;
        console.log(await sql`INSERT INTO "Item" ${sql({ ...item, legacyId: id, timestamp: new Date(timestamp * 1000) })}`);
    }
    // return Promise.allSettled(items.map(({ id, timestamp, ...item }) => 
    // sql`
    //     INSERT INTO "Item" ${sql({ ...item, legacyId: id, timestamp: new Date(timestamp * 1000) })}`
    // ));
    // return Promise.allSettled(items.map(({ id, timestamp, ...item }) => 
    // sql`
    //     INSERT INTO "Item" ${sql({ ...item, legacyId: id, timestamp: new Date(timestamp * 1000) })}`
    // ));
};

(async () => {
    const stage = "CODE"; //TODO prompt for stage (so we can do PROD)
  
    const DBProxyName = getDatabaseProxyName(stage);
  
    const dbProxyResponse = await new AWS.RDS(standardAwsConfig)
      .describeDBProxies({ DBProxyName })
      .promise();
  
    const { Endpoint } = dbProxyResponse.DBProxies![0]!;
    process.env[ENVIRONMENT_VARIABLE_KEYS.databaseHostname] = Endpoint!;
    console.log(`DB Proxy Hostname: ${Endpoint!}`);
  
    if (await isThereExistingTunnel(Endpoint!)) {
      console.log(
        `It looks like there is already a suitable SSH tunnel established on localhost:${DATABASE_PORT} 🎉`
      );
    } else {
      const jumpHostInstanceId = await getJumpHost(stage);
  
      await establishTunnelToDBProxy(stage, jumpHostInstanceId, Endpoint!);
    }
  
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

    const result = await migrateItems(sql);
    console.log(result);
})();
  