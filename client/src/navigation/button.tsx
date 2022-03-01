import React from "react";
import { css } from "@emotion/react";
import { pinboard } from "../../colours";

interface NavButtonProps {
  onClick?: () => void;
  icon: React.FC;
  hoverParent?: boolean;
}
export const NavButton: React.FC<NavButtonProps> = ({
  onClick,
  icon: Icon,
  hoverParent,
}) => (
  <span
    onClick={onClick}
    css={css`
      height: 24px;
      width: 24px;
      border-radius: 24px;
      ${hoverParent ? "*:hover > &" : "&:hover"} {
        background-color: ${pinboard[800]};
        cursor: pointer;
      }
      display: flex;
      justify-content: center;
      align-items: center;
    `}
  >
    <Icon />
  </span>
);
