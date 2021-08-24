import React from "react";

interface PushNotificationPreferencesOpenerProps {
  hasWebPushSubscription: boolean | null | undefined;
}

export const PushNotificationPreferencesOpener = ({
  hasWebPushSubscription,
}: PushNotificationPreferencesOpenerProps) => {
  const hostname = window.location.hostname;
  const toolsDomain = hostname.includes(".local.")
    ? "local.dev-gutools.co.uk"
    : hostname.includes(".code.") || hostname.includes(".test.")
    ? "code.dev-gutools.co.uk"
    : "gutools.co.uk";

  const desktopNotificationsPreferencesUrl = `https://pinboard.${toolsDomain}/push-notifications/`;

  const openDesktopNotificationsPreferencesWindowWithCallback = () => {
    const preferencesWindow = window.open(
      desktopNotificationsPreferencesUrl,
      "_blank"
    );
    if (!preferencesWindow) {
      alert("Could not open Desktop Notifications preferences window");
    }
  };

  const toggleButtonPrefix = hasWebPushSubscription
    ? "Unsubscribe from "
    : "Subscribe to ";

  // TODO style with more emphasis when hasWebPushSubscription is null/undefined (and probably hide the unsubscribe in a menu somewhere)
  return (
    <button onClick={openDesktopNotificationsPreferencesWindowWithCallback}>
      {toggleButtonPrefix}Desktop Notifications
    </button>
  );
};
