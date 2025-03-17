import React, { PropsWithChildren } from "react";
import { css, SerializedStyles } from "@emotion/react";
import { pinboard, pinMetal } from "../colours";
import PinIcon from "../icons/pin-icon.svg";
import { agateSans } from "../fontNormaliser";

interface ButtonInOtherToolsProps {
  iconAtEnd?: true;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  extraCss?: SerializedStyles;
  title?: string;
}
export const ButtonInOtherTools = ({
  children,
  iconAtEnd,
  onClick,
  extraCss,
  title,
}: PropsWithChildren<ButtonInOtherToolsProps>) => (
  <button
    onClick={onClick}
    css={css`
      display: flex;
      align-items: center;
      background-color: ${pinboard[500]};
      ${agateSans.xxsmall({ fontWeight: "bold" })};
      border: none;
      border-radius: 100px;
      padding: 0 ${iconAtEnd ? 6 : 10}px 0 ${iconAtEnd ? 10 : 6}px;
      min-height: 24px;
      cursor: pointer;
      color: ${pinMetal};
      ${extraCss};
    `}
    title={title}
  >
    {iconAtEnd && children}
    <PinIcon
      css={css`
        height: 14px;
        margin-${iconAtEnd ? "left" : "right"}: 2px;
        path {
          stroke: ${pinMetal};
          stroke-width: 1px;
        }
      `}
    />
    {!iconAtEnd && children}
  </button>
);
