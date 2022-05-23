import type { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";

export enum PINBOARD_TELEMETRY_TYPE {
  FLOATY_EXPANDED = "FLOATY_EXPANDED",
  FLOATY_CLOSED = "FLOATY_CLOSED",
  ADD_TO_PINBOARD_BUTTON_CLICKED = "ADD_TO_PINBOARD_BUTTON_CLICKED",
  DRAG_AND_DROP_GRID = "DRAG_AND_DROP_GRID",
  GRID_ASSET_OPENED = "GRID_ASSET_OPENED",
  NOTIFICATION_SETTING_CHANGED = "NOTIFICATION_SETTING_CHANGED",
}

interface IPinboardEventTags {
  pinboardId?: string;
  documentUrl?: string;
  assetType?: GridAssetType;
  notification?: PinboardNotificationSetting;
}

type GridAssetType = "grid-search" | "grid-crop" | "grid-original";

type PinboardNotificationSetting = "ON" | "OFF";

export type SendTelemetryEvent =
  | undefined
  | ((type: PINBOARD_TELEMETRY_TYPE, tags?: IPinboardEventTags) => void);

export const TelemetryContext = React.createContext<
  SendTelemetryEvent | undefined
>(undefined);
