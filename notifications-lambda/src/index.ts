import * as webPush from "web-push";
import { publicVapidKey } from "../../shared/constants";
import { pinboardSecretPromiseGetter } from "../../shared/awsIntegration";
import { Item } from "../../shared/graphql/graphql";
import { PushSubscription } from "web-push";

export interface UserWithWebPushSubscription {
  email: string;
  webPushSubscription: PushSubscription;
}

interface InputEventFromDatabaseTrigger {
  item: Item;
  users: UserWithWebPushSubscription[];
}
export const handler = async ({
  item,
  users,
}: InputEventFromDatabaseTrigger) => {
  const privateVapidKey = await pinboardSecretPromiseGetter(
    "notifications/privateVapidKey"
  );

  await Promise.allSettled(
    users.map((user) =>
      webPush
        .sendNotification(user.webPushSubscription, JSON.stringify(item), {
          vapidDetails: {
            subject: "mailto:digitalcms.bugs@guardian.co.uk",
            publicKey: publicVapidKey,
            privateKey: privateVapidKey,
          },
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
        })
    )
  );
};
