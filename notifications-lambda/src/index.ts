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
import { PushSubscription } from "web-push";

type UserWithWebPushSubscription = MyUser & {
  webPushSubscription: PushSubscription;
};

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
        FilterExpression:
          "attribute_exists(webPushSubscription) AND isMentionable = :isMentionable",
        ExpressionAttributeValues: {
          ":isMentionable": true,
        },
      })
      .promise();

    if (userResults.Items) {
      await Promise.all(
        userResults.Items.reduce<UserWithWebPushSubscription[]>(
          (acc, user) =>
            user.webPushSubscription
              ? [
                  ...acc,
                  {
                    ...user,
                    manuallyOpenedPinboardIds:
                      user.manuallyOpenedPinboardIds?.values, // extract items from String Set
                  } as UserWithWebPushSubscription,
                ]
              : acc,
          []
        )?.flatMap((user) =>
          items
            .filter(
              // TODO: Include more scenarios that trigger desktop notification
              (item) =>
                isUserMentioned(item, user) ||
                (item.userEmail !== user.email && // ensure we don't notify the person who sent the message
                  doesUserManuallyHavePinboardOpen(item, user))
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
