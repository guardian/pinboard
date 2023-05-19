import ReactDOM from "react-dom";
import React, { useEffect, useMemo } from "react";
import { css } from "@emotion/react";
import root from "react-shadow/emotion";
import { composer, pinboard, pinMetal } from "../../colours";
import { PinboardIdWithItemCounts } from "shared/graphql/graphql";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import { useGlobalStateContext } from "../globalState";
import { SvgSpinner } from "@guardian/source-react-components";

export const COUNT_COLUMNS_MIN_WIDTH = 25;

interface InlineModePinboardToggleProps {
  node: HTMLElement;
  pinboardId: string;
  counts: PinboardIdWithItemCounts | undefined;
  isSelected: boolean;
  setMaybeSelectedPinboardId: (newId: string | null) => void;
}

const rowHighlightBoxShadowStyle = `inset 0px -6px 0px -3px ${pinboard[500]}, inset 0px 6px 0px -3px ${pinboard[500]}`;

const InlineModePinboardToggle = ({
  node,
  pinboardId,
  counts,
  isSelected,
  setMaybeSelectedPinboardId,
}: InlineModePinboardToggleProps) => {
  const { unreadFlags } = useGlobalStateContext();

  useEffect(() => {
    const row = node.parentElement;
    if (isSelected && row) {
      row.style.boxShadow = rowHighlightBoxShadowStyle;
      row.style.position = "sticky";
      row.style.top = "68px";
      row.style.bottom = "0px";
      row.style.zIndex = "3";

      const groupHeadingTHs = document.querySelectorAll<HTMLElement>(
        ".content-list__group-heading"
      );
      let hasFoundThisNodesGroupIndex = false;
      for (const groupHeadingTH of Array.from(groupHeadingTHs)) {
        if (groupHeadingTH.dataset.groupTitle === node.dataset.groupTitle) {
          groupHeadingTH.style.bottom = `${row.offsetHeight - 1}px`;
          hasFoundThisNodesGroupIndex = true;
        } else if (hasFoundThisNodesGroupIndex) {
          //i.e. group headings after the row we're making sticky
          groupHeadingTH.style.top = `${row.offsetHeight + 68 - 1}px`;
        }
      }

      return () => {
        if (row) {
          row.style.boxShadow = "";
          row.style.position = "";
          row.style.top = "";
          row.style.bottom = "";
          row.style.zIndex = "";
        }
        groupHeadingTHs.forEach((groupHeadingTH) => {
          groupHeadingTH.style.top = "";
          groupHeadingTH.style.bottom = "";
        });
      };
    }
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
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          white-space: nowrap;
          color: ${pinMetal};
          border-radius: ${space[1]}px;
          min-height: 18px;
          padding: 2px 12px 2px 3px;
          margin: 0 3px;
          background-color: ${isSelected ? pinboard["500"] : "none"};
          color: ${palette.neutral[86]};
          &:hover {
            background-color: ${pinboard[isSelected ? "800" : "500"]};
            color: ${palette.neutral[0]};
          }
        `}
      >
        {!!counts?.unreadCount && unreadFlags?.[pinboardId] !== false && (
          <span
            css={css`
              text-align: right;
              min-width: ${COUNT_COLUMNS_MIN_WIDTH}px;
            `}
          >
            <span
              css={css`
                display: inline-block;
                border-radius: 10px;
                background-color: ${composer.primary[400]};
                padding: 0 2px;
                margin: 1px;
                min-width: 14px;
                color: ${palette.neutral[100]};
                text-align: center;
                font-weight: bold;
              `}
            >
              {counts.unreadCount}
            </span>
          </span>
        )}
        <span
          css={css`
            display: inline-block;
            min-width: ${COUNT_COLUMNS_MIN_WIDTH}px;
            text-align: right;
            ${counts?.totalCount === 0
              ? ""
              : `font-weight: bold; color: ${palette.neutral[0]};`}
          `}
        >
          {counts?.totalCount}
        </span>
        {counts?.totalCount === undefined && (
          <div
            css={css`
              svg {
                width: 15px;
                height: 15px;
                circle {
                  stroke: ${palette.neutral[86]};
                }
                path {
                  stroke: ${palette.neutral[60]};
                }
              }
            `}
          >
            <SvgSpinner />
          </div>
        )}
      </div>
    </root.div>
  );
};

export const InlineModePinboardTogglePortal = (
  props: InlineModePinboardToggleProps
) =>
  useMemo(
    // memo here ensures we don't call ReactDOM.createPortal for all re-renders, only meaningful prop changes
    // otherwise performance is terrible with lots of rows
    () =>
      ReactDOM.createPortal(
        <InlineModePinboardToggle {...props} />,
        props.node
      ),
    [
      props.node,
      props.pinboardId,
      props.counts?.unreadCount,
      props.counts?.totalCount,
      props.isSelected,
    ]
  );
