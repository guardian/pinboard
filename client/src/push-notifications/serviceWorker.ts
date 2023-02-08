import { ItemWithParsedPayload } from "../types/ItemWithParsedPayload";
import {
  EXPAND_PINBOARD_QUERY_PARAM,
  OPEN_PINBOARD_QUERY_PARAM,
  PINBOARD_ITEM_ID_QUERY_PARAM,
} from "../../../shared/constants";
import { extractNameFromEmail } from "../../../shared/util";

const toolsDomain = self.location.hostname.replace("pinboard.", "");

const showNotification = (
  item: ItemWithParsedPayload & {
    clientId?: string;
  }
) => {
  const user = extractNameFromEmail(item.userEmail);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.registration.getNotifications().then((notifications) => {
    const maybeExistingNotification = notifications.find(
      (notification: Notification) => notification.data?.id === item.id
    );

    if (maybeExistingNotification && item.deletedAt) {
      maybeExistingNotification.close();
    } else if (!maybeExistingNotification || item.clientId)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      self.registration.showNotification(
        `📌 ${user.firstName} ${user.lastName} at ${new Date(
          item.timestamp
        ).toLocaleTimeString()}`,
        {
          tag: item.id,
          data: item,
          body: item.type === "claim" ? `claimed a request` : item.message,
          icon: item.payload?.thumbnail,
          image: item.payload?.thumbnail,
          requireInteraction: true,
          actions: [
            {
              action: "grid",
              title: "Open in new Grid tab",
              icon:
                "https://media.gutools.co.uk/assets/images/grid-favicon-32.png",
            },
            {
              action: "composer",
              title: "Open in new Composer tab",
              icon:
                "https://composer.gutools.co.uk/static/10791/image/images/favicon.ico",
            },
          ],
        }
      );
  });
};

self.addEventListener("message", (event: MessageEvent) => {
  if (event.data.item) {
    showNotification({
      ...event.data.item,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      clientId: event.source?.id,
    });
  } else if (event.data.clearNotificationsForPinboardId) {
    const pinboardId = event.data.clearNotificationsForPinboardId;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach(
        (notification: Notification) =>
          notification.data?.pinboardId === pinboardId && notification.close()
      );
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("push", (event: any) => {
  showNotification(event.data.json());
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();

  const item = event.notification.data;

  const openToPinboardQueryParam = `${OPEN_PINBOARD_QUERY_PARAM}=${item.pinboardId}`;
  const openToPinboardItemIdQueryParam = `${PINBOARD_ITEM_ID_QUERY_PARAM}=${item.id}`;

  event.waitUntil(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    self.clients
      .matchAll({
        includeUncontrolled: true,
      })
      .then((clients: WindowClient[]) => {
        if (!event.action && clients.length > 0) {
          const client =
            clients.find(
              (client: WindowClient) =>
                client.id === item.clientId ||
                client.url?.includes(
                  `?${OPEN_PINBOARD_QUERY_PARAM}=${item.pinboardId}`
                )
            ) || clients[0];
          client.postMessage({ item }); // send this item to the client, so ideally it can highlight the message from the notification
          console.log(
            "Pinboard push notification click, attempting to focus client"
          );
          return client.focus();
        } else if (event.action === "grid") {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return self.clients.openWindow(
            `https://media.${toolsDomain}/search?${openToPinboardQueryParam}&${openToPinboardItemIdQueryParam}`.replace(
              ".code.",
              ".test."
            )
          );
        } else if (
          event.action === "composer" ||
          !event.action ||
          clients.length === 0
        ) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return self.clients.openWindow(
            `https://workflow.${toolsDomain}/redirect/${item.pinboardId}?${EXPAND_PINBOARD_QUERY_PARAM}=true&${openToPinboardItemIdQueryParam}`
          );
        }
        return Promise.resolve();
      })
  );
});
