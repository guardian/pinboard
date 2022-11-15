import ReactDOM from "react-dom";
import React from "react";
import { css } from "@emotion/react";
import root from "react-shadow/emotion";
import { pinboard, pinMetal } from "../colours";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { SvgSpinner } from "@guardian/source-react-components";
import { space } from "@guardian/source-foundations";

export const WORKFLOW_TITLE_QUERY_SELECTOR =
  ".content-list-item__field--working-title, .content-list-item__field--headline";

interface InlinePinboardToggleProps {
  pinboardId: string;
  counts: PinboardIdWithItemCounts | undefined;
  isLoading: boolean;
}

const InlinePinboardToggle = ({
  counts,
  isLoading,
}: InlinePinboardToggleProps) => (
  <root.div style={{ float: "right" }}>
    <div
      css={css`
        text-align: right;
        min-width: ${space["5"]}px;
        background-color: ${pinboard["500"]};
        color: ${pinMetal};
        padding: 2px;
        border-radius: ${space[1]}px;
      `}
    >
      {isLoading ? (
        <SvgSpinner size="xsmall" />
      ) : (
        <span>
          {!!counts?.unreadCount && (
            <span>
              <span
                css={css`
                  background-color: red;
                  border-radius: 50%;
                `}
              >
                {counts.unreadCount}
              </span>{" "}
              of{" "}
            </span>
          )}
          {counts?.totalCount || 0}
        </span>
      )}
    </div>
  </root.div>
);

interface InlinePinboardTogglePortalProps extends InlinePinboardToggleProps {
  node: HTMLElement;
}

export const InlinePinboardTogglePortal = ({
  node,
  ...props
}: InlinePinboardTogglePortalProps) =>
  ReactDOM.createPortal(<InlinePinboardToggle {...props} />, node);
