// import * as webPush from "web-push";
// import { publicVapidKey } from "../../shared/constants";
// import { PushSubscription } from "web-push";

export const handler = async (event: unknown) => {
  console.log("input", event);
  // const privateVapidKey = await pinboardSecretPromiseGetter(
  //   "notifications/privateVapidKey"
  // );

  // webPush
  //     .sendNotification(
  //         user.webPushSubscription,
  //         JSON.stringify(item),
  //         {
  //             vapidDetails: {
  //                 subject: "mailto:digitalcms.bugs@guardian.co.uk",
  //                 publicKey: publicVapidKey,
  //                 privateKey: privateVapidKey,
  //             },
  //         }
  //     )
  //     .then((result) => {
  //         if (result.statusCode < 300) {
  //             console.log(
  //                 `Sent web push to ${user.email} with message ${item.message}`,
  //                 result.body
  //             );
  //         } else {
  //             throw Error(result.body);
  //         }
  //     })
  //     .catch((errorPushing) => {
  //         console.error(
  //             `Failed to push to ${user.email} with message ${item.message}`,
  //             errorPushing
  //         );
  //     })
};
