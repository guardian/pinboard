import AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { Sql } from "../src/sql/types";
import { createDbTunnel } from "../../shared/database/local/tunnel";

const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);

type User = Record<string, unknown>;
export async function getUsersToMigrate(): Promise<User[]> {
  const getStoredUsers = async (
    startKey?: DocumentClient.Key
  ): Promise<User[]> => {
    const userResults = await dynamo
      .scan({
        TableName: "pinboard-CODE-pinboardusertable2621B03F-16NOYN7UMQ1RS",
        ExclusiveStartKey: startKey,
      })
      .promise();

    const storedUsers = userResults.Items || [];

    if (userResults.LastEvaluatedKey) {
      return [
        ...storedUsers,
        ...(await getStoredUsers(userResults.LastEvaluatedKey)),
      ];
    } else {
      return storedUsers;
    }
  };

  return getStoredUsers();
}

export async function getItemsToMigrate(): Promise<User[]> {
  const getStoredItems = async (
    startKey?: DocumentClient.Key
  ): Promise<User[]> => {
    const itemsResults = await dynamo
      .scan({
        TableName: "pinboard-CODE-pinboarditemtable83382753-1QVZDRAX9CZ3I",
        ExclusiveStartKey: startKey,
      })
      .promise();

    const items = itemsResults.Items || [];

    if (itemsResults.LastEvaluatedKey) {
      return [
        ...items,
        ...(await getStoredItems(itemsResults.LastEvaluatedKey)),
      ];
    } else {
      return items;
    }
  };

  return getStoredItems();
}

export async function migrateUsers(sql: Sql) {
  const users = await getUsersToMigrate();
  console.log("NUMBER TO WRITE", users.length);
  return Promise.allSettled(
    users.map(
      ({ ttlEpochSeconds, manuallyOpenedPinboardIds, ...user }) =>
        sql`INSERT INTO "User" ${sql({
          ...user,
          //@ts-ignore
          manuallyOpenedPinboardIds: manuallyOpenedPinboardIds?.values || null,
        })}`
    )
  );
}

export async function migrateItems(sql: Sql) {
  const items = await getItemsToMigrate();
  //@ts-ignore
  items.sort((a, b) => a.timestamp - b.timestamp);
  //@ts-ignore
  for (const { id, timestamp, user, seenBy, ...item } of items) {
    if (!item.userEmail) continue;
    console.log(
      await sql`INSERT INTO "Item" ${sql({
        ...item,
        legacyId: id,
        //@ts-ignore
        timestamp: new Date(timestamp * 1000),
      })}`
    );
  }
}

(async () => {
  await createDbTunnel();

  const sql = await getDatabaseConnection();

  console.log(await migrateItems(sql));
})();
