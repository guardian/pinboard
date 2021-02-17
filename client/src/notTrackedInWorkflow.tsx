/** @jsx jsx */

import React from "react";
import { jsx } from "@emotion/react";
import { standardWidgetContainerCss } from "./widget";

export const NotTrackedInWorkflow = () => (
  <div css={standardWidgetContainerCss}>
    In order to use Pinboard, please:
    <ol>
      <li>Track this piece in Workflow using the left side panel</li>
      <li>Refresh the page</li>
    </ol>
  </div>
);
