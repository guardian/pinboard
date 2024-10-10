import { css } from "@emotion/react";
import React from "react";
import { StaticGridPayload } from "../types/PayloadAndType";
import CropIcon from "../../icons/crop.svg";
import PictureIcon from "../../icons/picture.svg";
import { palette } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";

export const GridStaticImageDisplay = ({
  type,
  payload,
}: StaticGridPayload) => (
  <>
    <img
      src={payload.thumbnail}
      css={css`
        object-fit: contain;
        width: 100%;
        height: 100%;
      `}
      draggable={false}
      // TODO: hover for larger thumbnail
    />
    <div
      css={css`
        display: flex;
        gap: 3px;
        align-items: center;
        ${agateSans.xxsmall({ lineHeight: "tight" })}
        margin-top: 6px;
        color: ${palette.neutral[46]};
        svg {
          fill: ${palette.neutral[46]};
          margin-top: -2px;
        }
      `}
    >
      {type === "grid-crop" && <CropIcon />}
      {type === "grid-original" && <PictureIcon />}
      {payload.cropType}
      {payload.cropType && payload.aspectRatio && " ("}
      {payload.aspectRatio}
      {payload.cropType && payload.aspectRatio && ")"}
    </div>
  </>
);
