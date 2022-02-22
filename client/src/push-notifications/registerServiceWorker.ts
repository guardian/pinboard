import { publicVapidKey } from "../../../shared/constants";

const toggleButton = document.getElementById("toggleNotificationsButton");

const parentCallback = (maybeWebPushSubscription?: PushSubscription) => {
  console.log(
    `Pinboard: ${
      maybeWebPushSubscription ? "subscribing to " : "unsubscribing from"
    } Desktop Notifications`
  );
  window.opener.postMessage(
    {
      webPushSubscription:
        maybeWebPushSubscription && JSON.stringify(maybeWebPushSubscription),
    },
    "*"
  );
  window.close();
};

(async () => {
  if (toggleButton && "serviceWorker" in navigator) {
    // running in popout (rather than iFrame)
    if (window.opener) {
      const swRegistration = await navigator.serviceWorker.register(
        "serviceWorker.js",
        {
          updateViaCache: "none",
        }
      );

      console.log("Pinboard Service Worker running");
      await swRegistration.update();

      const maybePushSubscription = await swRegistration.pushManager.getSubscription();

      if (maybePushSubscription) {
        toggleButton.innerText = "Unsubscribe from Desktop Notifications";
        toggleButton.addEventListener("click", async () => {
          await maybePushSubscription.unsubscribe();
          parentCallback();
        });
      } else {
        toggleButton.innerText = "Subscribe to Desktop Notifications";
        toggleButton.addEventListener("click", async () => {
          if ((await Notification.requestPermission()) === "granted") {
            parentCallback(
              await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicVapidKey,
              })
            );
          } else {
            alert("You must accept the 'Notifications' permission.");
          }
        });
      }
    }
    // running in iFrame
    else {
      // unfortunately can't call serviceWorker.register() due to cross-origin service worker prevention
      const maybeSwRegistration = await navigator.serviceWorker.getRegistration();

      if (maybeSwRegistration) {
        console.log("Pinboard Service Worker running");
        await maybeSwRegistration.update();
        if (await maybeSwRegistration.pushManager.getSubscription()) {
          window.addEventListener("message", (event) => {
            // forward message from page (which has Pinboard on it) to the service worker
            maybeSwRegistration.active?.postMessage(event.data);
          });
          navigator.serviceWorker.addEventListener("message", (event) => {
            // forward message from service worker on to the page (which has Pinboard on it)
            window.parent.postMessage(event.data, "*");
          });
        }
      } else {
        console.log("No Pinboard service worker.");
      }
    }
  }
})();
