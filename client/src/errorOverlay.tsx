import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { bottom, floatySize, panelCornerSize, right } from "./styling";
import { composer } from "../colours";
import { agateSans } from "../fontNormaliser";
import { SvgAlertTriangle } from "@guardian/source-react-components";
import React from "react";

export const ErrorOverlay = () => (
  <div
    css={css`
      position: absolute;
      top: 32px;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 98;
      border-top-left-radius: ${space[1]}px;
      border-top-right-radius: ${space[1]}px;
      background-color: rgba(255, 255, 255, 0.35);
      &::after {
        content: "";
        position: fixed;
        background: rgba(255, 255, 255, 0.35);
        width: ${panelCornerSize}px;
        height: ${panelCornerSize}px;
        bottom: ${bottom + floatySize + space[2]}px;
        right: ${right + floatySize / 2}px;
        border-bottom-left-radius: ${panelCornerSize}px;
      }
    `}
  >
    <div
      css={css`
        background-color: ${composer.warning[100]};
        color: ${palette.neutral[100]};
        ${agateSans.xsmall({ lineHeight: "tight", fontWeight: "bold" })}
        padding: ${space[2]}px;
        border-radius: ${space[1]}px;
        margin: ${space[2]}px;
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
          There has been an error. You may need to refresh the page to allow
          pinboard to reconnect. Make sure to save your work first!
        </div>
      </div>
    </div>
  </div>
);
