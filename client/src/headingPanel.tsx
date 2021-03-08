/** @jsx jsx */
import React, { PropsWithChildren } from "react";
import { css, jsx } from "@emotion/react";
import { pinboardPrimary } from "../colours";
import { space } from "@guardian/src-foundations";
interface HeadingPanelProps {
  heading: string;
  clearSelectedPinboard: undefined | (() => void);
  hasUnreadOnOtherPinboard: boolean;
  hasErrorOnOtherPinboard: boolean;
}

export const HeadingPanel = (props: PropsWithChildren<HeadingPanelProps>) => (
  <div
    css={css`
      background-color: ${pinboardPrimary};
      padding: ${space[1]}px;
    `}
  >
    <div
      css={css`
        font-weight: bold;
      `}
    >
      {props.clearSelectedPinboard && (
        <button onClick={props.clearSelectedPinboard}>
          👈
          {props.hasUnreadOnOtherPinboard && <sup>&nbsp;🔴</sup>}
          {props.hasErrorOnOtherPinboard && <sup>&nbsp;⚠️</sup>}
        </button>
      )}
      {props.heading}
    </div>
    {props.children}
  </div>
);
