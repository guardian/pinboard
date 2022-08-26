import { ItemWithParsedPayload } from "../types/ItemWithParsedPayload";

const showNotification = (
  item: ItemWithParsedPayload & {
    clientId?: string;
  }
) => {
  // TODO check for existing notification first (to preserve the `clientId` field)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.registration.showNotification(
    `📌 ${item.userEmail.substring(
      0,
      item.userEmail.indexOf("@")
    )} at ${new Date(item.timestamp).toLocaleTimeString()}`,
    {
      tag: item.id,
      data: item,
      body: item.message,
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

  // TODO make pinboard actually use these (a bit like we have for PRESELECT_PINBOARD_QUERY_PARAM)
  const openToItemQueryParam = `pinboardId=${item.pinboardId}&pinboardItemId=${item.id}`;

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
            `https://media.gutools.co.uk/search?${openToItemQueryParam}`
          );
        } else if (
          event.action === "composer" ||
          !event.action ||
          clients.length === 0
        ) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          self.clients.openWindow(
            //TODO somehow find out the composer ID (perhaps workflow has a nice redirect service from pinboard ID i.e. workflow stub ID)
            `https://composer.gutools.co.uk?${openToItemQueryParam}`
          );
        }
      })
  );
});
