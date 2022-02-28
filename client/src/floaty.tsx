import React from "react";
import { css } from "@emotion/react";
import { pinMetal, pinboard, composer } from "../colours";
import PinIcon from "../icons/pin-icon.svg";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { bottom, boxShadow, floatySize, right } from "./styling";

interface FloatyNotificationsBubbleProps {
  presetUnreadNotificationCount: number | undefined;
}
const FloatyNotificationsBubble = ({
  presetUnreadNotificationCount,
}: FloatyNotificationsBubbleProps) => (
  <div
    css={css`
      position: absolute;
      top: -3px;
      left: 26px;
      user-select: none;
      background-color: ${composer.warning[300]};
      min-width: ${space[4]}px;
      height: ${space[4]}px;
      border-radius: 12px;
      ${agateSans.xxsmall()};
      color: ${palette.neutral[100]};
      text-align: center;
    `}
  >
    <span
      css={css`
        margin: 0 4px;
        height: 100%;
        display: inline-block;
        vertical-align: middle;
        line-height: 12px;
      `}
    >
      {presetUnreadNotificationCount || ""}
    </span>
  </div>
);

export interface FloatyProps {
  presetUnreadNotificationCount: number | undefined;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  hasError: boolean;
  hasUnread: boolean;
}

export const Floaty = (props: FloatyProps) => {
  const {
    isExpanded,
    setIsExpanded,
    hasError,
    presetUnreadNotificationCount,
    hasUnread,
  } = props;
  return (
    <div
      css={css`
        position: fixed;
        z-index: 99999;
        bottom: ${bottom}px;
        right: ${right}px;
        width: ${floatySize}px;
        height: ${floatySize}px;
        border-radius: ${floatySize / 2}px;
        cursor: pointer;
        box-shadow: ${boxShadow};
        background-color: ${pinboard[500]};

        &:hover {
          background-color: ${pinboard[800]};
        }
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <PinIcon
        css={css`
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          height: 22px;
          width: 12px;
          path {
            stroke: ${pinMetal};
            stroke-width: 0.5px;
          }
        `}
      />
      {hasError && (
        <div
          css={css`
            position: absolute;
            font-size: ${floatySize / 4}px;
            bottom: -${floatySize / 16}px;
            right: 0px;
            user-select: none;
            text-shadow: 0 0 5px black;
          `}
        >
          ⚠️
        </div>
      )}
      {(presetUnreadNotificationCount !== undefined || hasUnread) && (
        <FloatyNotificationsBubble
          presetUnreadNotificationCount={presetUnreadNotificationCount}
        />
      )}
    </div>
  );
};
