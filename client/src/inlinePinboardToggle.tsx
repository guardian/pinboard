import ReactDOM from "react-dom";
import React from "react";
import { css } from "@emotion/react";
import root from "react-shadow/emotion";
import { composer, pinboard, pinMetal } from "../colours";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { SvgSpinner } from "@guardian/source-react-components";
import { palette, space } from "@guardian/source-foundations";

interface InlinePinboardToggleProps {
  pinboardId: string;
  counts: PinboardIdWithItemCounts | undefined;
  isLoading: boolean;
  isSelected: boolean;
  setMaybeSelectedPinboardId: (newId: string | null) => void;
}

const InlinePinboardToggle = ({
  pinboardId,
  counts,
  isLoading,
  isSelected,
  setMaybeSelectedPinboardId,
}: InlinePinboardToggleProps) => (
  <root.div
    style={{ display: "inline-block", width: "100%" }}
    onClickCapture={(event) => {
      event.stopPropagation();
      setMaybeSelectedPinboardId(isSelected ? null : pinboardId);
    }}
  >
    <div
      css={css`
        text-align: right;
        white-space: nowrap;
        background-color: ${pinboard[isSelected ? "800" : "500"]};
        color: ${pinMetal};
        padding: 2px 3px;
        border-radius: ${space[1]}px;
        width: 100%;
      `}
    >
      {isLoading ? (
        <SvgSpinner size="xsmall" />
      ) : (
        <span>
          {!!counts?.unreadCount && (
            <span>
              <div
                css={css`
                  display: inline-block;
                  border-radius: 50%;
                  background-color: ${composer.warning[300]};
                  padding: 1px 3px;
                  min-width: 10px;
                  color: ${palette.neutral[100]};
                  text-align: center;
                `}
              >
                {counts.unreadCount}
              </div>{" "}
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
