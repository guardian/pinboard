import { css } from "@emotion/react";
import React from "react";
import { StaticGridPayload } from "../types/PayloadAndType";
import CropIcon from "../../icons/crop.svg";
import PictureIcon from "../../icons/picture.svg";
import { palette } from "@guardian/source-foundations";

export const GridStaticImageDisplay = ({
  type,
  payload,
}: StaticGridPayload) => (
  <React.Fragment>
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

    {type === "grid-crop" && (
      <CropIcon
        css={css`
          fill: ${palette.neutral[46]};
          margin-top: 4px;
        `}
      />
    )}
    {type === "grid-original" && (
      <PictureIcon
        css={css`
          fill: ${palette.neutral[46]};
          margin-top: 4px;
        `}
      />
    )}
  </React.Fragment>
);
