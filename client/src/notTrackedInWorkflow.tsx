import React from "react";
import { standardFloatyContainerCss } from "./floaty";

export const NotTrackedInWorkflow = () => (
  <div css={standardFloatyContainerCss}>
    In order to use Pinboard, please:
    <ol>
      <li>Track this piece in Workflow using the left side panel</li>
      <li>Refresh the page</li>
    </ol>
  </div>
);
