import * as webPush from "web-push";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { AttributeMap, Key } from "aws-sdk/clients/dynamodb";
import { Item } from "../../shared/graphql/graphql";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import {
  getPrivateVapidKeyPromise,
  publicVapidKey,
} from "../../shared/constants";

interface DynamoStreamRecord {
  dynamodb: {
    NewImage: AttributeMap;
  };
}

interface DynamoStreamEvent {
  Records: DynamoStreamRecord[];
}

export const handler = async (event: DynamoStreamEvent) => {
  const dynamo = new AWS.DynamoDB.DocumentClient(standardAwsConfig);
  const usersTableName = getEnvironmentVariableOrThrow("usersTableName");
  const privateVapidKey = await getPrivateVapidKeyPromise();

  const processPageOfUsers = async (startKey?: Key) => {
    const userResults = await dynamo
      .scan({
        TableName: usersTableName,
        ExclusiveStartKey: startKey,
        ProjectionExpression: "email, webPushSubscription",
        FilterExpression: "attribute_exists(webPushSubscription)",
      })
      .promise();

    if (userResults.Items) {
      await Promise.all(
        userResults.Items.filter((user) => !!user.webPushSubscription)?.flatMap(
          (user) =>
            event.Records.map(
              (record) =>
                AWS.DynamoDB.Converter.unmarshall(
                  record.dynamodb.NewImage
                ) as Item
            )
              .filter(
                // TODO: Include more scenarios that trigger desktop notification
                (item) => item.mentions?.includes(user.email)
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
