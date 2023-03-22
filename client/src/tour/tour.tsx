import React, { useMemo } from "react";
import { palette, space } from "@guardian/source-foundations";
import BeaconIcon from "../../icons/beacon";
import Joyride, { Step } from "react-joyride";
import {
  useJumpToTourStep,
  useTourProgress,
  useTourStepRef,
  useTourStepRefs,
} from "./tourState";
import { TourStepID, tourStepMap } from "./tourStepMap";
import { composer } from "../../colours";

interface TourProps {
  panelElement: HTMLElement;
}

const tourButtonStyles = {
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
};

const nextButtonStyles = {
  ...tourButtonStyles,
  color: `${palette.neutral[100]}`,
  backgroundColor: `${composer.primary[300]}`,
};

const secondaryButtonStyles = {
  ...tourButtonStyles,
  color: `${composer.primary[300]}`,
  backgroundColor: `${palette.neutral[100]}`,
  marginRight: `${space[1]}px`,
};

export const Tour = ({ panelElement }: TourProps) => {
  const tourStepEntries = Object.entries(tourStepMap);

  const contentsStep: Step = {
    title: "Welcome to Pinboard",
    spotlightClicks: false,
    target: panelElement,
    content: (
      <div>
        A tool to discuss and share the assets for a story within the story
        itself.
        <div style={{ display: "flex", gap: `${space[1]}px` }}>
          <BeaconIcon />
          Follow the beacon to take a tour.
        </div>
        <hr
          style={{
            width: "100%",
            borderTop: `1px solid grey`,
            marginLeft: 0,
            borderBottom: 0,
          }}
        />
        <div>
          You can also jump straight:
          <ol style={{ marginTop: `${space[1]}px`, paddingLeft: "14px" }}>
            {tourStepEntries.map(([tourStepId, { title }]) => (
              <li
                key={tourStepId}
                onClick={useJumpToTourStep(tourStepId as TourStepID)}
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {title}
              </li>
            ))}
          </ol>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={secondaryButtonStyles}>Dismiss</button>
          <button
            style={nextButtonStyles}
            onClick={useJumpToTourStep("myPinboards")}
          >
            Next
          </button>
        </div>
      </div>
    ),
    placement: "left",
    hideFooter: true,
    disableBeacon: true,
  };

  const { stepIndex, handleCallback, isRunning } = useTourProgress();

  const steps: Step[] = useMemo(
    () => [
      contentsStep,
      ...tourStepEntries.map(([tourStepId, stepWithoutTarget]) => ({
        ...stepWithoutTarget,
        target: useTourStepRef(tourStepId as TourStepID).current || tourStepId,
      })),
    ],
    useTourStepRefs().map((_) => _.current)
  );

  return (
    <Joyride
      callback={handleCallback}
      run={isRunning}
      steps={steps}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton={false}
      spotlightPadding={1}
      spotlightClicks
      disableOverlayClose
      showProgress
      locale={{ back: "Previous" }}
      styles={{
        options: {
          primaryColor: `${composer.primary[300]}`,
          zIndex: 999999,
        },
        tooltip: {
          fontFamily: "Guardian Agate Sans",
          fontSize: 14,
          padding: "8px",
          width: 300,
        },
        tooltipContent: {
          textAlign: "left",
          padding: "10px 10px 0",
        },
        buttonNext: { fontSize: 14, ...nextButtonStyles },
        buttonBack: { fontSize: 14, ...secondaryButtonStyles },
      }}
    />
  );
};
