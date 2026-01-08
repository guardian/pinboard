import React, { useContext } from "react";
import { agateSans } from "../fontNormaliser";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import { useGlobalStateContext } from "./globalState";
import { OPEN_PINBOARD_QUERY_PARAM } from "../../shared/constants";
import { isPinboardData } from "../../shared/graphql/extraTypes";
interface PushNotificationPreferencesOpenerProps {
  hasWebPushSubscription: boolean | null | undefined;
}

const hostname = window.location.hostname;
const toolsDomain = hostname.includes(".local.")
  ? "local.dev-gutools.co.uk"
  : hostname.includes(".code.") || hostname.includes(".test.")
  ? "code.dev-gutools.co.uk"
  : "gutools.co.uk";

export const desktopNotificationsPreferencesUrl = `https://pinboard.${toolsDomain}/push-notifications/index.html`;

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
}: HiddenIFrameForServiceWorkerProps) => {
  const { selectedPinboardId, preselectedPinboard } = useGlobalStateContext();
  const maybePinboardId = isPinboardData(preselectedPinboard)
    ? preselectedPinboard.id
    : selectedPinboardId;
  return (
    <iframe
      ref={iFrameRef}
      src={`${desktopNotificationsPreferencesUrl}${
        maybePinboardId
          ? `?${OPEN_PINBOARD_QUERY_PARAM}=${maybePinboardId}`
          : ""
      }`}
    />
  );
};
