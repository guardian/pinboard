import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { buttonBackground } from "./styling";
import { SvgCross } from "@guardian/source-react-components";
import React from "react";

interface FloatingClearButtonProps {
  clear: () => void;
}
export const FloatingClearButton = ({ clear }: FloatingClearButtonProps) => (
  <div
    css={css`
      height: ${space[5]}px;
      width: ${space[5]}px;
      border-radius: ${space[5]}px;
      ${buttonBackground(palette.neutral[60])};
      background-color: ${palette.neutral[46]};
      fill: ${palette.neutral[100]};

      &:hover {
        background-color: ${palette.neutral[20]};
      }

      &:active {
        background-color: ${palette.neutral[86]};
        fill: ${palette.neutral[20]};
      }
      position: absolute;
      right: ${space[2]}px;
      top: ${space[2]}px;
    `}
    onClick={(event) => {
      event.stopPropagation();
      clear();
    }}
  >
    <SvgCross />
  </div>
);
