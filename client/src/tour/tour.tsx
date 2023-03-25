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
import { TourStepID, tourStepIDs, tourStepMap } from "./tourStepMap";
import { composer } from "../../colours";
import { LineBreak, primaryButtonStyles, Tooltip } from "./toolTip";

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
          Follow the beacon to take a tour.
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
          Stories must be tracked in Workflow to have a Pinboard attached.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p>1 of {tourStepIDs.length}</p>
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

  const { stepIndex, handleCallback, isRunning, successfulSends } =
    useTourProgress();

  const steps: Step[] = useMemo(
    () => [
      contentsStep,
      ...tourStepEntries.map(([tourStepId, stepWithoutTarget]) => {
        const shouldPreventNext =
          stepWithoutTarget.shouldPreventNext?.(successfulSends);

        return {
          ...stepWithoutTarget,
          target:
            stepWithoutTarget.shouldPreventNext && !shouldPreventNext
              ? panelElement
              : useTourStepRef(tourStepId as TourStepID).current || tourStepId,
          spotlightClicks:
            stepWithoutTarget.spotlightClicks !== false &&
            (!stepWithoutTarget.shouldPreventNext || shouldPreventNext),
          // TODO - disable next button if shouldPreventNext
        };
      }),
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
