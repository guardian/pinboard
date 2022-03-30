import * as webPush from "web-push";
import * as AWS from "aws-sdk";
import {
  pinboardSecretPromiseGetter,
  standardAwsConfig,
} from "../../shared/awsIntegration";
import { Key } from "aws-sdk/clients/dynamodb";
import { Item, MyUser } from "../../shared/graphql/graphql";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { publicVapidKey } from "../../shared/constants";
import { DynamoDBStreamEvent } from "aws-lambda";

const isUserMentioned = (item: Item, user: MyUser) =>
  item.mentions?.includes(user.email);

const doesUserManuallyHavePinboardOpen = (item: Item, user: MyUser) =>
  user.manuallyOpenedPinboardIds?.includes(item.pinboardId);

export const handler = async (event: DynamoDBStreamEvent) => {
  const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);
  const usersTableName = getEnvironmentVariableOrThrow("usersTableName");
  const privateVapidKey = await pinboardSecretPromiseGetter(
    "notifications/privateVapidKey"
  );

  const items: Item[] = event.Records.reduce(
    (acc, record) =>
      record.dynamodb?.NewImage
        ? [
            ...acc,
            AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) as Item,
          ]
        : acc,
    [] as Item[]
  );

  const processPageOfUsers = async (startKey?: Key) => {
    const userResults = await dynamo
      .scan({
        TableName: usersTableName,
        ExclusiveStartKey: startKey,
        ProjectionExpression:
          "email, webPushSubscription, manuallyOpenedPinboardIds",
        FilterExpression: "attribute_exists(webPushSubscription)",
      })
      .promise();

    if (userResults.Items) {
      await Promise.all(
        userResults.Items.filter((user) => !!user.webPushSubscription)?.flatMap(
          (user) =>
            items
              .filter(
                // TODO: Include more scenarios that trigger desktop notification
                (item) =>
                  isUserMentioned(item, user as MyUser) ||
                  doesUserManuallyHavePinboardOpen(item, user as MyUser)
              )
              .map((item) =>
                webPush
                  .sendNotification(
                    user.webPushSubscription,
                    JSON.stringify(item),
                    {
                      vapidDetails: {
                        subject: "mailto:digitalcms.bugs@guardian.co.uk",
                        publicKey: publicVapidKey,
                        privateKey: privateVapidKey,
                      },
                    }
                  )
                  .then((result) => {
                    if (result.statusCode < 300) {
                      console.log(
                        `Sent web push to ${user.email} with message ${item.message}`,
                        result.body
                      );
                    } else {
                      throw Error(result.body);
                    }
                  })
                  .catch((errorPushing) => {
                    console.error(
                      `Failed to push to ${user.email} with message ${item.message}`,
                      errorPushing
                    );
                  })
              )
        )
      );
    }

    if (userResults.LastEvaluatedKey) {
      await processPageOfUsers(userResults.LastEvaluatedKey);
    }
  };

  await processPageOfUsers();
};
