import { css } from "@emotion/react";
import React from "react";
import { EmbedPayload } from "../types/PayloadAndType";

export const EmbedDisplay = ({ payload }: Pick<EmbedPayload, "payload">) => (
  <iframe
    css={css`
      pointer-events: none;
    `}
    srcDoc={`<html><body style="margin: 0; overflow: clip; transform: scale(0.5); transform-origin: 0 0">${payload.html}</body></html>`}
    allowFullScreen
    frameBorder="0"
  ></iframe>
);
