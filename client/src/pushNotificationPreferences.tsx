import React, { useContext } from "react";
import { agateSans } from "../fontNormaliser";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
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
  const sendTelemetryEvent = useContext(TelemetryContext);

  const openDesktopNotificationsPreferencesWindow = () => {
    window.open(desktopNotificationsPreferencesUrl, "_blank") ||
      alert("Could not open Desktop Notifications preferences window");
    sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.NOTIFICATION_SETTING_CHANGED, {
      notification: hasWebPushSubscription ? "OFF" : "ON",
    });
  };

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
