/** @jsx jsx */
import React, { PropsWithChildren } from "react";
import { css, jsx } from "@emotion/react";
interface HeadingPanelProps {
  heading: string;
  clearSelectedPinboard: undefined | (() => void);
}

export const HeadingPanel = (props: PropsWithChildren<HeadingPanelProps>) => (
  <div
    css={css`
      background-color: orange;
      padding: 5px;
    `}
  >
    <div
      css={css`
        font-weight: bold;
      `}
    >
      {props.clearSelectedPinboard && (
        <button onClick={props.clearSelectedPinboard}>👈</button>
      )}
      {props.heading}
    </div>
    {props.children}
  </div>
);
