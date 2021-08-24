const toggleButton = document.getElementById("toggleNotificationsButton");

const parentCallback = (maybeWebPushSubscription?: PushSubscription) => {
  window.opener.postMessage(
    maybeWebPushSubscription && JSON.stringify(maybeWebPushSubscription),
    "*"
  );
  window.close();
};

if (toggleButton && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("serviceWorker.ts")
    .then((swRegistration) => {
      swRegistration.pushManager
        .getSubscription()
        .then((maybePushSubscription) => {
          if (maybePushSubscription) {
            toggleButton.innerText = "Unsubscribe from Desktop Notifications";
            toggleButton.addEventListener("click", () => {
              maybePushSubscription.unsubscribe().then(() => parentCallback());
            });
          } else {
            toggleButton.innerText = "Subscribe to Desktop Notifications";
            toggleButton.addEventListener("click", () => {
              Notification.requestPermission().then((permissionResult) => {
                if (permissionResult === "granted") {
                  swRegistration.pushManager
                    .subscribe({
                      userVisibleOnly: true,
                      applicationServerKey:
                        "BN90j1vBKosQik3VeWkS8tYyA9XooaAKhqJAvZR6WNqZRc2l6FYY0qeaj_Yss8IJjVYM88h5DSY7rZuQumI7ckA",
                    })
                    .then(parentCallback);
                } else {
                  alert("You must accept the 'Notifications' permission.");
                }
              });
            });
          }
        });
    })
    .catch(function (err) {
      console.log("Could not register service worker.", err);
    });
}
