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
  // TODO check for existing notification first (to preserve the `clientId` field)

  const user = extractNameFromEmail(item.userEmail);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.registration.showNotification(
    `📌 ${user.firstName} ${user.lastName} at ${new Date(
      item.timestamp
    ).toLocaleTimeString()}`,
    {
      tag: item.id,
      data: item,
      body: item.type === "claim" ? `claimed a group mention` : item.message,
      icon: item.payload?.thumbnail,
      image: item.payload?.thumbnail,
      requireInteraction: true,
      actions: [
        {
          action: "grid",
          title: "Open in new Grid tab",
          icon: "https://media.gutools.co.uk/assets/images/grid-favicon-32.png",
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((clients: any[]) => {
        if (!event.action && clients.length > 0) {
          const client =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clients.find((_: any) => _.id === item.clientId) || clients[0];
          client.postMessage({
            item,
          });
        } else if (event.action === "grid") {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          self.clients.openWindow(
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
          self.clients.openWindow(
            `https://workflow.${toolsDomain}/redirect/${item.pinboardId}?${EXPAND_PINBOARD_QUERY_PARAM}=true&${openToPinboardItemIdQueryParam}`
          );
        }
      })
  );
});
