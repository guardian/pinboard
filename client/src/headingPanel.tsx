import React, { PropsWithChildren } from "react";
import { css } from "@emotion/react";
import { space } from "@guardian/source-foundations";
import { pinboard } from "../colours";
interface HeadingPanelProps {
  heading: string;
  clearSelectedPinboard: () => void;
  hasUnreadOnOtherPinboard: boolean;
  hasErrorOnOtherPinboard: boolean;
}

export const HeadingPanel = (props: PropsWithChildren<HeadingPanelProps>) => (
  <div
    css={css`
      background-color: ${pinboard[500]};
      padding: ${space[1]}px;
    `}
  >
    <div
      css={css`
        font-weight: bold;
      `}
    >
      <button onClick={props.clearSelectedPinboard}>
        👈
        {props.hasUnreadOnOtherPinboard && <sup>&nbsp;🔴</sup>}
        {props.hasErrorOnOtherPinboard && <sup>&nbsp;⚠️</sup>}
      </button>
      {props.heading}
    </div>
    {props.children}
  </div>
);
