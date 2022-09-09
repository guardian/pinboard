import AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { standardAwsConfig } from "../../awsIntegration";
import { createDatabaseTunnel } from "./databaseTunnel";
import { getDatabaseConnection } from "../databaseConnection";
import { Sql } from "../types";

const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);

async function getDynamoRows(
  TableName: string
): Promise<DocumentClient.AttributeMap[]> {
  const getRows = async (
    startKey?: DocumentClient.Key
  ): Promise<DocumentClient.AttributeMap[]> => {
    const userResults = await dynamo
      .scan({
        TableName,
        ExclusiveStartKey: startKey,
      })
      .promise();

    const storedUsers = userResults.Items || [];

    if (userResults.LastEvaluatedKey) {
      return [...storedUsers, ...(await getRows(userResults.LastEvaluatedKey))];
    } else {
      return storedUsers;
    }
  };

  return getRows();
}

export async function migrateUsers(sql: Sql, tableName: string) {
  const users = await getDynamoRows(tableName);
  console.log("NUMBER TO WRITE", users.length);
  return Promise.allSettled(
    users
      .filter(({ firstName, lastName }) => firstName && lastName)
      .map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ ttlEpochSeconds, manuallyOpenedPinboardIds, ...user }) =>
          sql`
        INSERT INTO "User" ${sql({
          ...user,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          manuallyOpenedPinboardIds: manuallyOpenedPinboardIds?.values || null,
        })}
        ON CONFLICT ("email") DO NOTHING`
      )
  );
}

export async function migrateItemsAndLastItemSeenByUser(
  sql: Sql,
  itemTableName: string,
  lastItemSeenByUserTableName: string
) {
  const items = await getDynamoRows(itemTableName);
  const lastItemSeenByUsers = await getDynamoRows(lastItemSeenByUserTableName);
  if ((await sql`SELECT COUNT(*) AS count FROM "Item"`)[0].count > 0) {
    throw new Error("The 'Item' table is not empty. Aborting migration.");
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  items.sort((a, b) => a.timestamp - b.timestamp);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  for (const { id, timestamp, user, seenBy, ...item } of items) {
    if (!item.userEmail) {
      continue;
    }
    const newStyleID = (
      await sql`
        INSERT INTO "Item" ${sql({
          ...item,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          timestamp: new Date(timestamp * 1000),
        })}
        ON CONFLICT ("id") DO NOTHING
        RETURNING "id"
    `
    )[0].id;
    console.log(
      "migrated Item with id",
      id,
      "- now has new style id",
      newStyleID
    );
    const matchingLastItemSeenByUsers = lastItemSeenByUsers.filter(
      ({ itemID }) => itemID === id
    );
    console.log(
      await Promise.all(
        matchingLastItemSeenByUsers.map(
          (lastItemSeenByUser) =>
            sql`
        INSERT INTO "LastItemSeenByUser" ${sql({
          ...lastItemSeenByUser,
          seenAt: new Date(lastItemSeenByUser.seenAt * 1000),
          itemID: newStyleID,
        })}
      `
        )
      )
    );
  }
}

(async () => {
  const DYNAMO_TABLE_NAMES = {
    CODE: {
      User: "pinboard-CODE-pinboardusertable2621B03F-16NOYN7UMQ1RS",
      Item: "pinboard-CODE-pinboarditemtable83382753-1QVZDRAX9CZ3I",
      LastItemSeenByUser:
        "pinboard-CODE-pinboardlastitemseenbyusertable132BE99C-15W8MHP4HJB1N",
    },
    PROD: {
      User: "pinboard-PROD-pinboardusertable2621B03F-108EXGU72O7BW",
      Item: "pinboard-PROD-pinboarditemtable83382753-1LQARAGXCSLI8",
      LastItemSeenByUser:
        "pinboard-PROD-pinboardlastitemseenbyusertable132BE99C-DFE4L38U1XBV",
    },
  };

  const stage: "CODE" | "PROD" = await createDatabaseTunnel();

  const sql = await getDatabaseConnection();

  const dynamoTableNames = DYNAMO_TABLE_NAMES[stage];

  console.log(await migrateUsers(sql, dynamoTableNames.User));

  console.log(
    await migrateItemsAndLastItemSeenByUser(
      sql,
      dynamoTableNames.Item,
      dynamoTableNames.LastItemSeenByUser
    )
  );
})();
