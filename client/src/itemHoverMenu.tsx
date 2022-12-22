import { css } from "@emotion/react";
import React from "react";
import { palette, space } from "@guardian/source-foundations";
import Pencil from "../icons/pencil.svg";

export const ITEM_HOVER_MENU_CLASS_NAME = "item-hover-menu";

export const ItemHoverMenu = () => (
  <div
    className={ITEM_HOVER_MENU_CLASS_NAME}
    css={css`
      display: none; // :hover in ItemDisplay sets this to 'display: flex'
      position: absolute;
      top: 0;
      right: 0;
      background: ${palette.neutral["86"]};
      border-radius: 12px;
      padding: ${space[1] / 2}px;
      gap: ${space[1] / 2}px;
      button {
        font-size: 11px;
        border: none;
        border-radius: 50%;
        padding: ${space[1] / 2}px ${space[1]}px;
        cursor: pointer;
        background: ${palette.neutral["86"]};
        &:hover {
          background: ${palette.neutral["60"]};
          svg {
            fill: ${palette.neutral[10]};
          }
        }
        svg {
          fill: ${palette.neutral[20]};
        }
      }
    `}
  >
    <button>
      <Pencil />
    </button>
    <button>🗑 {/*FIXME use SVG from Ana*/}</button>
  </div>
);
