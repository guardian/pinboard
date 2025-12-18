import { css } from "@emotion/react";
import React from "react";
import { MamVideoPayload } from "../types/PayloadAndType";
import VideoIcon from "../../icons/video.svg";
import { palette } from "@guardian/source-foundations";

export const MamVideoDisplay = ({ type, payload }: MamVideoPayload) => (
  <React.Fragment>
    {payload.externalUrl && payload.externalUrl.toLowerCase() !== "false" ? (
      <iframe
        css={css`
          pointer-events: none;
        `}
        src={payload.externalUrl}
        allowFullScreen
        frameBorder="0"
      ></iframe>
    ) : (
      <img
        src={payload.thumbnail}
        css={css`
          object-fit: contain;
          width: 100%;
          height: 100%;
          max-height: 150px;
        `}
        draggable={false}
        // TODO: hover for larger thumbnail
      />
    )}

    {type === "mam-video" && (
      <VideoIcon
        css={css`
          fill: ${palette.neutral[46]};
          margin-top: 4px;
        `}
      />
    )}
  </React.Fragment>
);
