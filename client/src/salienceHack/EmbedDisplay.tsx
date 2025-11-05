import { css } from "@emotion/react";
import React from "react";
import { EmbedPayload } from "../types/PayloadAndType";

export const EmbedDisplay = ({ payload }: Pick<EmbedPayload, "payload">) => (
  <iframe
    css={css`
      pointer-events: none;
      width: 200%; //not scale down in the srcDoc
    `}
    srcDoc={`<html><body style="margin: 0; overflow: clip; transform: scale(0.5); transform-origin: 0 0">${payload.html}</body></html>`}
    allowFullScreen
    frameBorder="0"
    onLoad={(e) => {
      const contentDoc = e.currentTarget.contentDocument;
      if (contentDoc) {
        e.currentTarget.style.height = contentDoc.body.scrollHeight / 2 + "px"; //scale down
      }
    }}
  ></iframe>
);
