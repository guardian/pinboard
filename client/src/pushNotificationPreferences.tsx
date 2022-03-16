import React from "react";
import { agateSans } from "../fontNormaliser";
interface PushNotificationPreferencesOpenerProps {
  hasWebPushSubscription: boolean | null | undefined;
}

const hostname = window.location.hostname;
const toolsDomain = hostname.includes(".local.")
  ? "local.dev-gutools.co.uk"
  : hostname.includes(".code.") || hostname.includes(".test.")
  ? "code.dev-gutools.co.uk"
  : "gutools.co.uk";

export const desktopNotificationsPreferencesUrl = `https://pinboard.${toolsDomain}/push-notifications/`;

export const PushNotificationPreferencesOpener = ({
  hasWebPushSubscription,
}: PushNotificationPreferencesOpenerProps) => {
  const openDesktopNotificationsPreferencesWindow = () =>
    window.open(desktopNotificationsPreferencesUrl, "_blank") ||
    alert("Could not open Desktop Notifications preferences window");

  const toggleButtonPrefix = hasWebPushSubscription
    ? "Unsubscribe from "
    : "Subscribe to ";

  return (
    <button
      css={{
        fontFamily: agateSans.xxsmall(),
        width: "100%",
      }}
      onClick={openDesktopNotificationsPreferencesWindow}
    >
      {toggleButtonPrefix}Desktop Notifications
    </button>
  );
};

interface HiddenIFrameForServiceWorkerProps {
  iFrameRef: React.MutableRefObject<HTMLIFrameElement | null>;
}

export const HiddenIFrameForServiceWorker = ({
  iFrameRef,
}: HiddenIFrameForServiceWorkerProps) => (
  <iframe
    ref={iFrameRef}
    src={desktopNotificationsPreferencesUrl}
    style={{ display: "none" }}
  />
);
