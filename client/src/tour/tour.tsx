import React, { useMemo } from "react";
import { space } from "@guardian/source-foundations";
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
import { LineBreak, primaryButtonStyles, Tooltip } from "./tooltip";
import root from "react-shadow/emotion";
import { css } from "@emotion/react";

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
      <root.div
        css={css`
          list-style-type: auto;
        `}
      >
        Pinboard allows users to easily have a conversation, and share image
        assets from within a file.
        <br />
        Take a tour
        <div style={{ display: "flex", gap: `${space[1]}px` }}>
          <BeaconIcon />
          <span>
            <strong>Follow the beacon</strong> or select from the list below.
          </span>
        </div>
        <LineBreak />
        <div>
          You can also jump straight:
          <ol style={{ marginTop: `${space[1]}px`, paddingLeft: "25px" }}>
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
          You can access Pinboard on:
          <ul style={{ marginTop: `${space[1]}px` }}>
            <li>
              <strong>Composer</strong>
            </li>
            <li>
              <strong>Workflow</strong>
            </li>
            <li>
              <strong>Grid</strong>
            </li>
          </ul>
          Files must be tracked in Workflow to appear on Pinboard
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
      </root.div>
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
    subscriptionItems,
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
    [
      ...useTourStepRefs().map((_) => _.current),
      ...successfulSends,
      ...subscriptionItems,
    ]
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
