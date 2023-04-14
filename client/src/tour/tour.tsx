import React, { useMemo } from "react";
import { space } from "@guardian/source-foundations";
import Joyride, { Step } from "react-joyride";
import {
  useJumpToTourStep,
  useTourProgress,
  useTourStepRef,
  useTourStepRefs,
} from "./tourState";
import { TourStepID, tourStepMap } from "./tourStepMap";
import { composer } from "../../colours";
import { Tooltip } from "./tooltip";
import { css } from "@emotion/react";
import Warning from "../../icons/warning.svg";

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
      <div
        css={css`
          list-style-type: auto;
        `}
      >
        Pinboard allows users to easily have conversations and share image
        assets specific to Composer pieces.
        <div
          css={css`
            margin-top: ${space[2]}px;
          `}
        >
          <p
            css={css`
              margin-bottom: 0;
            `}
          >
            Explore Pinboard&apos;s features:
          </p>
          <div>
            <ol
              css={css`
                margin-top: 0;
                padding-left: ${space[6]}px;
              `}
            >
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
          You can access Pinboard in:
          <ul
            css={css`
              margin-top: ${space[1]}px;
              padding-left: ${space[6]}px;
            `}
          >
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
          <Warning viewBox="2 -3 16 13" />
          Composer pieces must be tracked in Workflow to appear in Pinboard.
        </div>
        {/* <div
          css={css`
            display: flex;
            justify-content: space-between;
            margin-top: ${space[3]}px;
          `}
        >
          <p
            css={css`
              font-size: ${space[3]}px;
            `}
          >
            1 of {tourStepIDs.length + 1}
          </p>
          <button
            style={primaryButtonStyles}
            onClick={useJumpToTourStep("myPinboards")}
          >
            Next
          </button>
        </div> */}
      </div>
    ),
    placement: "left",
    hideFooter: false,
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
