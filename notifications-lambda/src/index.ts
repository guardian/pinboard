import * as webPush from "web-push";
import { publicVapidKey } from "shared/constants";
import { pinboardSecretPromiseGetter } from "shared/awsIntegration";
import { Item } from "shared/graphql/graphql";
import { PushSubscription } from "web-push";
import { getDatabaseConnection } from "shared/database/databaseConnection";
import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import serverlessExpress from "@codegenie/serverless-express";
import { server } from "./server";

export interface UserWithWebPushSubscription {
  email: string;
  webPushSubscription: PushSubscription;
}

interface InputEventFromDatabaseTrigger {
  item: Item;
  users: UserWithWebPushSubscription[];
}

// TODO in UI, loudly prompt users to re-subscribe if in potentially expired state
// TODO also in UI, make the 'subscribe/unsubscribe' button more prominent and more importantly derived not only from DB entry but also by querying service worker (via hidden iframe) for whether there is an active sub for the current browser

const serverHandler = serverlessExpress({ app: server });

// undefined/null inputPayload indicates a scheduled nightly event to send empty pushes to all subscriptions to weed out expired ones
export const handler = async (
  inputPayload: InputEventFromDatabaseTrigger | APIGatewayEvent | undefined | null,
  context: Context,
  callback: Callback
) => {

  if (inputPayload && "httpMethod" in inputPayload) {
    // API Gateway event routed to Express server
    return serverHandler(inputPayload, context, callback);
  }

  const vapidDetails = {
    subject: "mailto:digitalcms.bugs@guardian.co.uk",
    publicKey: publicVapidKey,
    privateKey: await pinboardSecretPromiseGetter(
      "notifications/privateVapidKey"
    ),
  };

  // must be a scheduled event to weed out expired subscriptions
  if (!inputPayload) {
    console.log(
      "Running daily job to weed out expired web push subscriptions..."
    );

    const sql = await getDatabaseConnection();
    const rows = await sql`SELECT "email", "webPushSubscription"
        FROM "User"
        WHERE "webPushSubscription" IS NOT NULL
          AND ("webPushSubscription"->'isExpired')::boolean IS NOT TRUE`;

    for (const { email, webPushSubscription } of rows) {
      await webPush
        .sendNotification(webPushSubscription, null, {
          vapidDetails,
        })
        .then((result) => {
          if (result.statusCode < 300) {
            console.log(
              `Push subscription for ${email} appears to still be valid.`,
              result.body
            );
          } else {
            throw Error(result.body);
          }
        })
        .catch(async (errorPushing) => {
          console.warn(
            `Push subscription for ${email} looks to be expired or invalid. Updating DB accordingly...`,
            errorPushing?.body?.trim?.()
          );
          await sql`UPDATE "User"
                  SET "webPushSubscription" = jsonb_set("webPushSubscription", '{isExpired}', 'true'::jsonb)
                  WHERE email = ${email}`
            .then(() =>
              console.log(
                `...push subscription for ${email} marked as expired in DB.`
              )
            )
            .catch((e) =>
              console.error(
                `...FAILED to mark push subscription for ${email} as expired in DB.`,
                e
              )
            );
        });
    }
    return;
  }

  // must be a DB-triggered event to send real notification
  const { item, users } = inputPayload;
  await Promise.allSettled(
    users.map((user) =>
      webPush
        .sendNotification(user.webPushSubscription, JSON.stringify(item), {
          vapidDetails,
        })
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
          // TODO consider setting `isExpired` flag in DB here too (or is that messy and nightly is sufficient)
        })
    )
  );
};
