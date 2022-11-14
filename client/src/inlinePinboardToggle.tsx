import ReactDOM from "react-dom";
import React from "react";
import { css } from "@emotion/react";
import root from "react-shadow/emotion";
import { pinboard, pinMetal } from "../colours";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { SvgSpinner } from "@guardian/source-react-components";

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
        background-color: ${pinboard["500"]};
        color: ${pinMetal};
        padding: 2px;
      `}
    >
      {isLoading ? <SvgSpinner size="xsmall" /> : counts?.totalCount || 0}
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
