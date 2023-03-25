import React from "react";
import { palette, space } from "@guardian/source-foundations";
import { TooltipRenderProps } from "react-joyride";
import { composer } from "../../colours";
import { tourStepIDs } from "./tourStepMap";

export const tourButtonStyles = {
  display: "flex",
  alignItems: "flex-start",
  fontFamily: "Guardian Agate Sans",
  border: `${composer.primary[300]} 1px solid`,
  borderRadius: `${space[2]}px`,
  padding: `${space[1]}px ${space[2]}px`,
  gap: `${space[2]}px`,
  lineHeight: "2",
  cursor: "pointer",
  fontWeight: 800,
  alignSelf: "center",
};

export const primaryButtonStyles = {
  ...tourButtonStyles,
  color: `${palette.neutral[100]}`,
  backgroundColor: `${composer.primary[300]}`,
};

export const secondaryButtonStyles = {
  ...tourButtonStyles,
  backgroundColor: `${palette.neutral[100]}`,
  color: `${composer.primary[300]}`,
  marginRight: `${space[1]}px`,
};

export const LineBreak = () => (
  <hr
    style={{
      width: "100%",
      borderTop: `1px solid grey`,
      marginLeft: 0,
      borderBottom: 0,
    }}
  />
);

export const Tooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) => (
  <div
    {...tooltipProps}
    style={{
      fontFamily: "Guardian Agate Sans",
      fontSize: 15,
      padding: `${space[2]}px ${space[3]}px ${space[3]}px`,
      width: 250,
      backgroundColor: `${palette.neutral[100]}`,
      lineHeight: "20px",
      borderRadius: `${space[2]}px`,
    }}
  >
    {step.title && (
      <h3 style={{ margin: `${space[2]}px 0 ${space[3]}px` }}>{step.title}</h3>
    )}
    <div style={{ textAlign: "left" }}>{step.content}</div>
    {index > 0 && (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <p>
          {index + 1} of {tourStepIDs.length}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={secondaryButtonStyles} {...backProps}>
            Previous
          </button>
          <button style={primaryButtonStyles} {...primaryProps}>
            Next
          </button>
        </div>
      </div>
    )}
  </div>
);
