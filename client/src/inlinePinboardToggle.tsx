import ReactDOM from "react-dom";
import React, { useEffect } from "react";
import { css } from "@emotion/react";
import root from "react-shadow/emotion";
import { composer, pinboard, pinMetal } from "../colours";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { useGlobalStateContext } from "./globalState";

export const INLINE_TOGGLE_WIDTH = 50;

interface InlinePinboardToggleProps {
  node: HTMLElement;
  pinboardId: string;
  counts: PinboardIdWithItemCounts | undefined;
  isLoading: boolean;
  isSelected: boolean;
  setMaybeSelectedPinboardId: (newId: string | null) => void;
}

const rowHighlightBoxShadowStyle = `inset 0px -6px 0px -3px ${pinboard[500]}, inset 0px 6px 0px -3px ${pinboard[500]}`;

const InlinePinboardToggle = ({
  node,
  pinboardId,
  counts,
  isLoading,
  isSelected,
  setMaybeSelectedPinboardId,
}: InlinePinboardToggleProps) => {
  const { unreadFlags } = useGlobalStateContext();

  useEffect(() => {
    if (isSelected && node.parentElement) {
      node.parentElement.style.boxShadow = rowHighlightBoxShadowStyle;
    }
    return () => {
      if (node.parentElement) {
        node.parentElement.style.boxShadow = "none";
      }
    };
  }, [isSelected]);

  return (
    <root.div>
      <div
        onClick={(event) => {
          event.stopPropagation();
          setMaybeSelectedPinboardId(isSelected ? null : pinboardId);
        }}
        css={css`
          ${agateSans.xxsmall()};
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          white-space: nowrap;
          background-color: ${pinboard["500"]};
          color: ${pinMetal};
          border-radius: ${space[1]}px;
          min-width: ${INLINE_TOGGLE_WIDTH}px;
          min-height: 18px;
          padding: 2px 3px;
          &:hover {
            background-color: ${pinboard[isSelected ? "500" : "800"]};
          }
        `}
      >
        {isLoading ? (
          <em>loading...</em>
        ) : (
          <span>
            {counts?.unreadCount && unreadFlags?.[pinboardId] !== false ? (
              <span>
                <div
                  css={css`
                    display: inline-block;
                    border-radius: 10px;
                    background-color: ${composer.warning[300]};
                    padding: 0 2px;
                    margin: 1px;
                    min-width: 14px;
                    color: ${palette.neutral[100]};
                    text-align: center;
                    font-weight: bold;
                  `}
                >
                  {counts.unreadCount}
                </div>{" "}
                of
              </span>
            ) : (
              "total"
            )}{" "}
            <span
              css={css`
                font-weight: bold;
              `}
            >
              {counts?.totalCount || 0}
            </span>
          </span>
        )}
      </div>
    </root.div>
  );
};

export const InlinePinboardTogglePortal = (props: InlinePinboardToggleProps) =>
  ReactDOM.createPortal(<InlinePinboardToggle {...props} />, props.node);
