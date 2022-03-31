import React from "react";
import { standardPanelContainerCss } from "./styling";

export const NotTrackedInWorkflow = () => (
  <div css={standardPanelContainerCss}>
    In order to use Pinboard with this piece, please:
    <ol>
      <li>Track this piece in Workflow using the left side panel</li>
      <li>Refresh the page</li>
    </ol>
  </div>
);
