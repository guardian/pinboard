import React, { useMemo } from "react";
import { space } from "@guardian/source-foundations";
import root from "react-shadow/emotion";
import BeaconIcon from "../../icons/beacon";
import Joyride, { Step } from "react-joyride";
import {
  useJumpToTourStep,
  useTourProgress,
  useTourStepRef,
  useTourStepRefs,
} from "./tourState";
import { TourStepID, tourStepIDs, tourStepMap } from "./tourStepMap";
import { composer } from "../../colours";
import {
  LineBreak,
  primaryButtonStyles,
  Tooltip,
  tourButtonStyles,
} from "./toolTip";

interface TourProps {
  panelElement: HTMLElement;
}

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
          <b>Follow the beacon</b> to take a tour.
        </div>
        <LineBreak />
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
          <LineBreak />
          Access via:
          <ul style={{ marginTop: `${space[1]}px` }}>
            <li>Composer</li>
            <li>Workflow</li>
            <li>Grid</li>
          </ul>
          Stories must be tracked in Workflow to appear in Pinboard.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            marginTop: `${space[3]}px`,
          }}
        >
          <button
            style={primaryButtonStyles}
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

  const {
    stepIndex,
    handleCallback,
    isRunning,
    successfulSends,
    interactionFlags,
  } = useTourProgress();

  const steps: Step[] = useMemo(
    () => [
      contentsStep,
      ...tourStepEntries.map(([tourStepId, stepWithoutTarget]) => ({
        ...stepWithoutTarget,
        content:
          typeof stepWithoutTarget.content === "function"
            ? stepWithoutTarget.content(interactionFlags)
            : stepWithoutTarget.content,
        target: stepWithoutTarget.shouldEnlargeSpotlight?.(interactionFlags)
          ? panelElement // TODO - ideally replace with some ref that wraps ScrollableItems and SendMessageArea
          : useTourStepRef(tourStepId as TourStepID).current || tourStepId,
      })),
    ],
    [...useTourStepRefs().map((_) => _.current), ...successfulSends]
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
      locale={{ back: "Previous" }}
      tooltipComponent={Tooltip}
      styles={{
        options: {
          primaryColor: `${composer.primary[300]}`,
          zIndex: 999999,
        },
      }}
    />
  );
};
