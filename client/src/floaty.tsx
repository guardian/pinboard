import React, { useContext } from "react";
import { css } from "@emotion/react";
import { pinMetal, pinboard, composer } from "../colours";
import PinIcon from "../icons/pin-icon.svg";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { bottom, boxShadow, floatySize, right } from "./styling";
import { useGlobalStateContext } from "./globalState";
import { SvgAlertTriangle } from "@guardian/source-react-components";
import { dropTargetCss, IsDropTargetProps } from "./drop";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";

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
      min-width: ${space[2]}px;
      padding: 0 ${space[1]}px;
      height: ${space[4]}px;
      border-radius: ${space[2]}px;
      ${agateSans.xxsmall({ lineHeight: "regular" })};
      color: ${palette.neutral[100]};
      text-align: center;
    `}
  >
    {presetUnreadNotificationCount && presetUnreadNotificationCount > 0
      ? presetUnreadNotificationCount
      : ""}
  </div>
);

export const Floaty: React.FC<IsDropTargetProps> = ({ isDropTarget }) => {
  const {
    presetUnreadNotificationCount,
    isExpanded,
    setIsExpanded,
    hasError,
    hasUnread,
  } = useGlobalStateContext();

  const badge = (() => {
    if (hasError) {
      return (
        <div
          css={css`
            position: absolute;
            top: -4px;
            fill: ${composer.warning[100]};
            right: -4px;
            user-select: none;
          `}
        >
          <SvgAlertTriangle size="xsmall" />
        </div>
      );
    }
    if (presetUnreadNotificationCount !== undefined || hasUnread) {
      return (
        <FloatyNotificationsBubble
          presetUnreadNotificationCount={presetUnreadNotificationCount}
        />
      );
    }
  })();

  const sendTelemetryEvent = useContext(TelemetryContext);

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
      onClick={() => {
        setIsExpanded(!isExpanded);
        sendTelemetryEvent?.(
          isExpanded
            ? PINBOARD_TELEMETRY_TYPE.FLOATY_CLOSED
            : PINBOARD_TELEMETRY_TYPE.FLOATY_EXPANDED
        );
      }}
    >
      {isDropTarget && <div css={{ ...dropTargetCss, borderRadius: "50%" }} />}
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
      {badge}
    </div>
  );
};
