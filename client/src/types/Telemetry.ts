import type { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import React from "react";

export enum TelemetryType {
  FloatyExpanded = "PINBOARD_FLOATY_EXPANDED",
  FloatyClosed = "PINBOARD_FLOATY_CLOSED",
}

export type SendTelemetryEvent =
  | undefined
  | ((type: string, tags?: IUserTelemetryEvent["tags"]) => void);

export const TelemetryContext = React.createContext<
  SendTelemetryEvent | undefined
>(undefined);
