import type { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";

export enum TelemetryType {
  FloatyExpanded = "PINBOARD_FLOATY_EXPANDED",
  FloatyClosed = "PINBOARD_FLOATY_CLOSED",
  AddOriginalButton = "ADD_ORIGINAL_BUTTON",
  AddCropButton = "ADD_CROP_BUTTON",
  AddSearchButton = "ADD_SEARCH_BUTTON",
  DragDropSearch = "DRAG_AND_DROP_SEARCH",
  DragDropOriginal = "DRAG_AND_DROP_ORIGINAL",
  DragDropCrop = "DRAG_AND_DROP_CROP",
}

export type SendTelemetryEvent =
  | undefined
  | ((type: string, tags?: IUserTelemetryEvent["tags"]) => void);

export const TelemetryContext = React.createContext<
  SendTelemetryEvent | undefined
>(undefined);
