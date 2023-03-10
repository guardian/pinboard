import React, { useMemo } from "react";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import Joyride, { Placement, Step } from "react-joyride";
import PlayButton from "../../icons/play-button.svg";
import CloseIcon from "../../icons/close.svg";
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

const secondaryButtonStyles = {
  ...tourButtonStyles,
  color: `${composer.primary[300]}`,
  backgroundColor: `${palette.neutral[100]}`,
  marginRight: `${space[1]}px`,
};

const nextButtonStyles = {
  ...tourButtonStyles,
  color: `${palette.neutral[100]}`,
  backgroundColor: `${composer.primary[300]}`,
};

export const Tour = ({ panelElement }: TourProps) => {
  const tourStepEntries = Object.entries(tourStepMap);

  const contentsStep: Step = {
    title: "Welcome to pinboard",
    target: panelElement,
    content: (
      <div>
        <p>
          A tool to discuss and share the assets for a story within the story
          itself.
        </p>
        <div>
          Jump straight:
          <ul style={{ listStyleType: "none", margin: 0, padding: 0 }}>
            {tourStepEntries.map(([tourStepId, { title }]) => (
              <li
                key={tourStepId}
                onClick={useJumpToTourStep(tourStepId as TourStepID)}
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  color: `${composer.primary[300]}`,
                }}
              >
                {title}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={secondaryButtonStyles}>Dismiss</button>
          <button
            style={nextButtonStyles}
            onClick={useJumpToTourStep("myPinboards")}
          >
            Next (1/{tourStepEntries.length + 1})
          </button>
        </div>
      </div>
    ),
    placement: "left" as Placement,
    styles: {
      buttonNext: {
        display: "none",
      },
    },
  };

  const steps: Step[] = useMemo(() => {
    console.log("steps updated");
    return [
      contentsStep,
      ...tourStepEntries.map(([tourStepId, stepWithoutTarget]) => ({
        ...stepWithoutTarget,
        target: useTourStepRef(tourStepId as TourStepID),
      })),
    ];
  }, useTourStepRefs());

  const { stepIndex, handleCallback, run } = useTourProgress();

  return (
    <Joyride
      callback={handleCallback}
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton={false}
      spotlightPadding={1}
      spotlightClicks
      showProgress
      locale={{ back: "Previous" }}
      styles={{
        options: {
          primaryColor: "rgb(255, 140, 0)",
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
          padding: 10,
        },
        tooltipFooter: {
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: 0,
          margin: 0,
        },
        buttonNext: { fontSize: 14, ...nextButtonStyles },
        buttonBack: { fontSize: 14, ...secondaryButtonStyles },
      }}
    />
  );
};

export const TourStartButton = () => (
  <button
    css={css`
      display: flex;
      flex-direction: column;
      background-color: rgb(255, 140, 0);
      padding: ${space[1]}px;
      border-radius: 4px;
      ${agateSans.xxsmall({ lineHeight: "regular" })};
      gap: ${space[1]}px;
      margin: ${space[1]}px;
      margin-bottom: 0;
      cursor: pointer;
      border: 0;
    `}
    onClick={useTourProgress().start}
  >
    <div
      css={css`
        display: flex;
      `}
    >
      <PlayButton
        css={css`
          padding-top: 2px;
          margin-left: 3px;
        `}
      />
      <div
        css={css`
          color: white;
          padding-left: ${space[1]}px;
          text-align: left;
        `}
      >
        First time on Pinboard? Start guided tour.
      </div>
      <CloseIcon
        css={css`
          margin-left: 10px;
          height: 10px;
          padding-top: 3px;
        `}
      />
    </div>
  </button>
);
