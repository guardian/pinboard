// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("push", (event: any) => {
  const { message, userEmail, payload, timestamp } = event.data.json();
  const notificationTitle = `Pinboard: ${userEmail} at ${new Date(timestamp)}`;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  self.registration.showNotification(notificationTitle, {
    body: message,
    actions: [
      // TODO: Add handler for actions
      { action: "grid", title: "Open in Grid" },
      { action: "composer", title: "Open in Composer" },
    ],
    // icon: 'https://ame.com', // TODO: Serve proper Pinboard icon
    image: payload?.thumbnail,
  });
});
