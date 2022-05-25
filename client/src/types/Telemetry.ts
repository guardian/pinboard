import { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";
import { Tab } from "./Tab";

export enum PINBOARD_TELEMETRY_TYPE {
  FLOATY_EXPANDED = "FLOATY_EXPANDED",
  FLOATY_CLOSED = "FLOATY_CLOSED",
  ADD_TO_PINBOARD_BUTTON_CLICKED = "ADD_TO_PINBOARD_BUTTON_CLICKED",
  DRAG_AND_DROP_GRID = "DRAG_AND_DROP_GRID",
  GRID_ASSET_OPENED = "GRID_ASSET_OPENED",
  NOTIFICATION_SETTING_CHANGED = "NOTIFICATION_SETTING_CHANGED",
  MESSAGE_SENT = "MESSAGE_SENT",
  GRID_URL_PASTED = "GRID_URL_PASTED",
  PINBOARD_LOADED_IN_ARTICLE = "PINBOARD_LOADED_IN_ARTICLE",
  SEEN_BY_EVENT = "PINBOARD_MESSAGE_SEEN",
}

export interface IPinboardEventTags {
  pinboardId?: string;
  assetType?: GridAssetType;
  notification?: PinboardNotificationSetting;
  messageType?: GridAssetType | "message-only";
  hasMentions?: boolean;
  tab?: Tab;
  composerId?: string;
  composerSection?: string;
  isGridLink?: boolean;
  isComposerLink?: boolean;
}

type GridAssetType = "grid-search" | "grid-crop" | "grid-original";

type PinboardNotificationSetting = "ON" | "OFF";

export type SendTelemetryEvent =
  | undefined
  | ((
      type: PINBOARD_TELEMETRY_TYPE,
      tags?: IUserTelemetryEvent["tags"] & IPinboardEventTags,
      value?: boolean | number
    ) => void);

export const TelemetryContext = React.createContext<
  SendTelemetryEvent | undefined
>(undefined);
