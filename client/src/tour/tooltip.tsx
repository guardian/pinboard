import React from "react";
import { palette, space } from "@guardian/source-foundations";
import { TooltipRenderProps } from "react-joyride";
import { composer } from "../../colours";
import { tourStepIDs } from "./tourStepMap";
import { SvgCross } from "@guardian/source-react-components";
import root from "react-shadow/emotion";

export const tourButtonStyles = {
  display: "flex",
  alignItems: "flex-start",
  fontFamily: "Guardian Agate Sans",
  border: `${composer.primary[300]} 1px solid`,
  borderRadius: `${space[1]}px`,
  fontSize: `${space[3]}px`,
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

const CloseButton = ({ ...props }) => {
  return (
    <div {...props} style={{ cursor: "pointer" }}>
      <SvgCross size="xsmall" />
    </div>
  );
};

const PrevButton = ({ ...props }) => {
  return (
    <button style={secondaryButtonStyles} {...props}>
      Previous
    </button>
  );
};
const NextButton = ({ ...props }) => {
  return (
    <button style={primaryButtonStyles} {...props}>
      Next
    </button>
  );
};

export const Tooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) => (
  <root.div
    {...tooltipProps}
    style={{
      fontFamily: "Guardian Agate Sans",
      fontSize: 15,
      padding: `${space[2]}px ${space[3]}px ${space[3]}px`,
      width: 253,
      backgroundColor: `${palette.neutral[100]}`,
      lineHeight: "150%",
      borderRadius: `${space[2]}px`,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      {step.title && (
        <h3 style={{ margin: `${space[2]}px 0 ${space[3]}px` }}>
          {step.title}
        </h3>
      )}
      <CloseButton {...closeProps} />
    </div>
    <div style={{ textAlign: "left" }}>{step.content}</div>
    {index > 0 && (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: `${space[4]}px`,
          marginBottom: `${space[2]}px`,
        }}
      >
        <p style={{ fontSize: `${space[3]}px`, marginBottom: 0 }}>
          {index + 1} of {tourStepIDs.length + 1}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <PrevButton {...backProps} />
          <NextButton {...primaryProps} />
        </div>
      </div>
    )}
  </root.div>
);
