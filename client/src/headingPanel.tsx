import React, { PropsWithChildren } from "react";

interface HeadingPanelProps {
  heading: string;
}

export const HeadingPanel = (props: PropsWithChildren<HeadingPanelProps>) => (
  <div
    style={{
      backgroundColor: "orange",
      padding: "5px",
    }}
  >
    <div style={{ fontWeight: "bold" }}>{props.heading}</div>
    {props.children}
  </div>
);
