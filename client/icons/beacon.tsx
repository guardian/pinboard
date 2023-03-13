import React from "react";
import { composer } from "../colours";

const BeaconIcon = () => {
  return (
    <button
      style={{
        backgroundColor: "transparent",
        border: "0px",
        borderRadius: "0px",
        color: "rgb(85, 85, 85)",
        cursor: "pointer",
        fontSize: "16px",
        lineHeight: "1",
        padding: "8px",
        appearance: "none",
        display: "inline-block",
        height: "20px",
        position: "relative",
        width: "20px",
      }}
    >
      <span
        style={{
          animation:
            "1.2s ease-in-out 0s infinite normal none running joyride-beacon-inner",
          backgroundColor: `${composer.primary[300]}`,
          borderRadius: "50%",
          display: "block",
          height: "50%",
          left: "50%",
          opacity: "0.7",
          position: "absolute",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "50%",
        }}
      ></span>
      <span
        style={{
          animation:
            "1.2s ease-in-out 0s infinite normal none running joyride-beacon-outer",
          border: `2px solid ${composer.primary[300]}`,
          borderRadius: "50%",
          boxSizing: "border-box",
          display: "block",
          height: "100%",
          left: "0px",
          opacity: "0.9",
          position: "absolute",
          top: "0px",
          transformOrigin: "center center",
          width: "100%",
        }}
      ></span>
    </button>
  );
};

export default BeaconIcon;
