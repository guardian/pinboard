import { CSSObject } from "@emotion/react";
import { palette } from "@guardian/source-foundations";
import React from "react";
import { buildPayloadAndType, PayloadAndType } from "./types/PayloadAndType";

export interface IsDropTargetProps {
  isDropTarget: boolean;
}

const GRID_DATA_TRANSFER_TYPE = "application/vnd.asset-handle+json";

export const isGridDragEvent = (event: React.DragEvent<HTMLElement>) =>
  event?.dataTransfer?.types?.includes(GRID_DATA_TRANSFER_TYPE);

export const convertGridDragEventToPayload = (
  event: React.DragEvent<HTMLElement>
): PayloadAndType | null => {
  const { source, sourceType, ...payload } = JSON.parse(
    event?.dataTransfer?.getData(GRID_DATA_TRANSFER_TYPE)
  );
  return buildPayloadAndType(`${source}-${sourceType}`, payload) || null;
};

export const dropTargetCss: CSSObject = {
  background: palette.neutral["60"],
  color: palette.neutral["20"],
  opacity: "80%",
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9999999,
  border: `4px dashed ${palette.neutral["20"]}`,
};
