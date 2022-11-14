import ReactDOM from "react-dom";
import React from "react";
import { css } from "@emotion/react";
import root from "react-shadow/emotion";
import { pinboard, pinMetal } from "../colours";
import { palette, space } from "@guardian/source-foundations";

export const WORKFLOW_TITLE_QUERY_SELECTOR =
  ".content-list-item__field--working-title, .content-list-item__field--headline";

interface InlinePinboardToggleProps {
  pinboardId: string;
}
const InlinePinboardToggle = ({ pinboardId }: InlinePinboardToggleProps) => (
  <root.div style={{ float: "right" }}>
    <div
      css={css`
        background-color: ${pinboard["500"]};
        color: ${pinMetal};
        padding: 2px;
      `}
    >
      {pinboardId}
    </div>
  </root.div>
);

interface InlinePinboardTogglePortalProps {
  node: HTMLElement;
}

export const InlinePinboardTogglePortal = ({
  node,
}: InlinePinboardTogglePortalProps) => {
  const pinboardId = node.parentElement?.id?.replace("stub-", ""); //TODO: log undefined
  return pinboardId
    ? ReactDOM.createPortal(
        <InlinePinboardToggle pinboardId={pinboardId} />,
        node
      )
    : null;
};
