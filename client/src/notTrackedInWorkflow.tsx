import React from "react";
import { standardPanelContainerCss } from "./styling";
import { useGlobalStateContext } from "./globalState";

export const NotTrackedInWorkflow = () => {
  const { openInTool, preselectedPinboard } = useGlobalStateContext();
  return (
    <div css={standardPanelContainerCss}>
      In order to use Pinboard with this piece, please:
      {openInTool === "media-atom-maker" ? (
        <ol>
          {preselectedPinboard === "unknown" ? (
            <li>
              Create a composer page by filling out the required metadata then
              using the button at the top of the page
            </li>
          ) : (
            <li>
              Open this piece&apos;s composer page using the button at the top
              of the page
            </li>
          )}
          <li>
            Track that composer piece in Workflow using the left side panel
          </li>
          <li>Return to this page and refresh</li>
        </ol>
      ) : (
        <ol>
          <li>Track this piece in Workflow using the left side panel</li>
          <li>Refresh the page</li>
        </ol>
      )}
    </div>
  );
};
