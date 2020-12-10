import React, { PropsWithChildren } from "react";

interface ConnectionInfoProps {}

export const ConnectionInfo = (
  props: PropsWithChildren<ConnectionInfoProps>
) => (
  <div
    style={{
      display:
        props.children &&
        (!Array.isArray(props.children) ||
          props.children.find((child) => child))
          ? "block"
          : "none",
      backgroundColor: "orange",
      padding: "5px",
    }}
  >
    {props.children}
  </div>
);
