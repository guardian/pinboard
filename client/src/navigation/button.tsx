import React from "react";
import { css } from "@emotion/react";
import { pinboard } from "../../colours";
import { neutral, palette, space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";

const numberedBubble = css`
  top: -4px;
  min-width: ${space[2]}px;
  padding: 0 ${space[1]}px;
  height: ${space[4]}px;
  border-radius: ${space[3]}px;
`;
const unnumberedBubble = css`
  top: 0px;
  height: ${space[2]}px;
  width: ${space[2]}px;
  border-radius: ${space[4]}px;
`;

interface NavButtonProps {
  onClick?: () => void;
  icon: React.FC;
  hoverParent?: boolean;
  unreadCount?: number | null;
  title?: string;
}
export const NavButton: React.FC<NavButtonProps> = ({
  onClick,
  icon: Icon,
  hoverParent,
  unreadCount,
  title,
}) => (
  <span
    title={title}
    onClick={onClick}
    css={css`
      position: relative;
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
      fill: ${neutral[20]};
    `}
  >
    {unreadCount !== null && unreadCount !== undefined && (
      // TODO merge this CSS with the notification bubble in floaty
      <div
        css={css`
          ${unreadCount > 0 ? numberedBubble : unnumberedBubble};
          position: absolute;
          left: ${space[3]}px;
          border: 2px solid ${pinboard[500]};
          user-select: none;
          background-color: ${palette.neutral[20]};
          ${agateSans.xxsmall({ lineHeight: "regular" })}
          color: ${palette.neutral[100]};
          text-align: center;
          ${hoverParent ? "*:hover > * > &" : "*:hover > &"} {
            border-color: ${pinboard[800]};
          }
        `}
      >
        {unreadCount > 0 && unreadCount}
      </div>
    )}
    <Icon />
  </span>
);
