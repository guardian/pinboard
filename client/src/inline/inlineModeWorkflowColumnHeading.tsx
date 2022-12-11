import root from "react-shadow/emotion";
import { css } from "@emotion/react";
import { COUNT_COLUMNS_MIN_WIDTH } from "./inlineModePinboardToggle";
import WorkflowUnreadIcon from "../../icons/workflow-unread.svg";
import WorkfklowTotalIcon from "../../icons/workflow-total.svg";
import React from "react";

export const InlineModeWorkflowColumnHeading = () => (
  <root.div>
    <div
      css={css`
        margin-top: -20px;
      `}
    >
      Pinboard{""}
      <div
        css={css`
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          margin: -1px 0 -2px 5px;
          gap: 7px;
        `}
      >
        <div
          css={css`
            display: inline-block;
            min-width: ${COUNT_COLUMNS_MIN_WIDTH}px;
            text-align: right;
          `}
        >
          <WorkflowUnreadIcon
            css={css`
              height: 17px;
              width: 16px;
            `}
          />
        </div>
        <div
          css={css`
            display: inline-block;
            min-width: ${COUNT_COLUMNS_MIN_WIDTH}px;
            text-align: right;
          `}
        >
          <WorkfklowTotalIcon
            css={css`
              height: 21px;
              width: 21px;
              margin-bottom: -1px;
            `}
          />
        </div>
      </div>
    </div>
  </root.div>
);
