import { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";
import { PayloadType } from "./PayloadAndType";
import { Tab } from "./Tab";

export enum PINBOARD_TELEMETRY_TYPE {
  FLOATY_EXPANDED = "FLOATY_EXPANDED",
  FLOATY_CLOSED = "FLOATY_CLOSED",
  ADD_TO_PINBOARD_BUTTON = "ADD_TO_PINBOARD_BUTTON",
  OPEN_FEEDBACK_FORM = "OPEN_FEEDBACK_FORM",
  OPEN_FEEDBACK_CHAT = "OPEN_FEEDBACK_CHAT",
  EXPAND_FEEDBACK_DETAILS = "OPEN_FEEDBACK_FORM",
  GRID_LINK_PASTED = "GRID_LINK_PASTED",
  DRAG_AND_DROP = "DRAG_AND_DROP",
  GRID_ASSET_OPENED = "GRID_ASSET_OPENED",
  NOTIFICATION_SETTING_CHANGED = "NOTIFICATION_SETTING_CHANGED",
  MESSAGE_SENT = "MESSAGE_SENT",
  MESSAGE_SEEN = "MESSAGE_SEEN",
  PINBOARD_LOADED = "PINBOARD_LOADED",
  DRAG_FROM_PINBOARD = "DRAG_FROM_PINBOARD",
  CLAIMED_ITEM = "CLAIMED_ITEM",
}

export interface IPinboardEventTags {
  pinboardId?: string;
  assetType?: PayloadType;
  notification?: PinboardNotificationSetting;
  messageType?: PayloadType | "message-only";
  hasMentions?: boolean;
  tab?: Tab;
  composerId?: string;
  composerSection?: string;
}

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
