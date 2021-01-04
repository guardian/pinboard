import React, { PropsWithChildren } from "react";

interface HeadingPanelProps {
  heading: string;
  clearSelectedPinboard: () => void;
}

export const HeadingPanel = (props: PropsWithChildren<HeadingPanelProps>) => (
  <div
    style={{
      backgroundColor: "orange",
      padding: "5px",
    }}
  >
    <div style={{ fontWeight: "bold" }}>
      <button onClick={props.clearSelectedPinboard}>👈</button>
      {props.heading}
    </div>
    {props.children}
  </div>
);
