import React from "react";
import { css } from "@emotion/react";
import { composer } from "../../colours";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import { SvgAlertTriangle } from "@guardian/source-react-components";

const enableWorkflowColumnAndReload = () => {
  const pinboardColumnCheckbox = document.querySelector<HTMLInputElement>(
    "#pinboard.column-configurator__label"
  );
  if (pinboardColumnCheckbox) {
    if (pinboardColumnCheckbox.checked) {
      pinboardColumnCheckbox.click(); // uncheck first if needs be
    }
    pinboardColumnCheckbox.click(); // click() rather than assigning checked=true, to ensure 'apply_column_changes' becomes enabled
  } else {
    alert(
      "Could not find pinboard column checkbox. Please add the Pinboard column manually."
    );
  }
  const applyChangesButton = document.getElementById("apply_column_changes");
  if (applyChangesButton) {
    applyChangesButton.click();
  } else {
    alert(
      "Could not find apply column changes button. Please add the Pinboard column manually."
    );
  }
};
export const WorkflowColumnInstructions = () => (
  <div
    css={css`
      background-color: ${composer.warning[100]};
      color: ${palette.neutral[100]};
      ${agateSans.xsmall({ lineHeight: "tight", fontWeight: "bold" })}
      padding: ${space[2]}px;
      border-radius: ${space[1]}px;
      margin: ${space[1]}px;
      position: relative;
      top: 0;
      z-index: 99;
    `}
  >
    <div
      css={css`
        display: flex;
        align-items: center;
        column-gap: ${space[2]}px;
      `}
    >
      <div
        css={css`
          fill: ${palette.neutral[100]};
        `}
      >
        <SvgAlertTriangle size="small" />
      </div>
      <div>
        It is <strong>strongly</strong> recommended that you enable the Pinboard
        column in workflow.
        <button
          css={css`
            ${agateSans.xsmall({ lineHeight: "tight", fontWeight: "bold" })};
            margin-top: ${space[1]}px;
            padding: ${space[1]}px ${space[2]}px;
            color: ${palette.neutral[100]};
            border: 1px solid ${composer.warning[300]};
            border-radius: ${space[1]}px;
            background-color: transparent;
            &:hover {
              background-color: ${composer.warning[300]};
            }
            cursor: pointer;
          `}
          onClick={enableWorkflowColumnAndReload}
        >
          ENABLE COLUMN NOW
        </button>
      </div>
    </div>
  </div>
);
