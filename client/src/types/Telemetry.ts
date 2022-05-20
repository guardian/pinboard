import type { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";

export enum TelemetryType {
  FloatyExpanded = "FLOATY_EXPANDED",
  FloatyClosed = "FLOATY_CLOSED",
  AddOriginalButton = "ADD_ORIGINAL_BUTTON",
  AddCropButton = "ADD_CROP_BUTTON",
  AddSearchButton = "ADD_SEARCH_BUTTON",
  DragDropSearch = "DRAG_AND_DROP_SEARCH",
  DragDropOriginal = "DRAG_AND_DROP_ORIGINAL",
  DragDropCrop = "DRAG_AND_DROP_CROP",
  NotificationSubscription = "NOTIFICATION_SUBSCRIBED",
  NotificationUnsubscription = "NOTIFITION_UNSUBSCRIBED",
}

export type SendTelemetryEvent =
  | undefined
  | ((type: string, tags?: IUserTelemetryEvent["tags"]) => void);

export const TelemetryContext = React.createContext<
  SendTelemetryEvent | undefined
>(undefined);
