import { css, CSSObject } from "@emotion/react";
import { space } from "@guardian/source-foundations";

export const top = 95; // to account for important toolbars/buttons in grid and composer
export const bottom = 108; // to account for Teleporter
export const right = 15;
export const floatySize = 40;
export const boxShadow =
  "rgba(0, 0, 0, 0.14) 0px 0px 4px, rgba(0, 0, 0, 0.28) 0px 4px 8px";
export const standardPanelContainerCss: CSSObject = {
  margin: `${space[1]}px`,
  h4: {
    color: "black",
  },
};

export const buttonBackground = (hoverColour: string) => css`
  height: ${space[6]}px;
  width: ${space[6]}px;
  border-radius: ${space[6]}px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background-color: ${hoverColour};
  }
`;

export const scrollbarsCss = (fg: string) => css`
  scrollbar-color: ${fg} transparent;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
    border: none;
    cursor: default;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${fg};
    background-clip: padding-box;
    border: 2px solid transparent;
    border-radius: 999px;
  }
`;

export const panelCornerSize = 24;
