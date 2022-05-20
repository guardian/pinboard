import type { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";

export enum TelemetryType {
  FloatyExpanded = "PINBOARD_FLOATY_EXPANDED",
  FloatyClosed = "PINBOARD_FLOATY_CLOSED",
  AddOriginalToPinboard = "ADD_ORIGINAL_TO_PINBOARD",
  AddCropToPinboard = "ADD_CROP_TO_PINBOARD",
}

export type SendTelemetryEvent =
  | undefined
  | ((type: string, tags?: IUserTelemetryEvent["tags"]) => void);

export const TelemetryContext = React.createContext<
  SendTelemetryEvent | undefined
>(undefined);
