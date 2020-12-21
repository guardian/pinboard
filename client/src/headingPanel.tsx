import React, { PropsWithChildren } from "react";

export const HeadingPanel = (props: PropsWithChildren<{}>) => (
  <div
    style={{
      backgroundColor: "orange",
      padding: "5px",
    }}
  >
    {props.children}
  </div>
);
