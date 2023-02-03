import React, { useContext, useState } from "react";
import { css } from "@emotion/react";
import { space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import Joyride, { CallBackProps, Step } from "react-joyride";
import PlayButton from "../icons/play-button.svg";
import CloseIcon from "../icons/close.svg";

export interface DemoState {
  run: boolean;
  steps: Step[];
}

export const GuidedTourStartButton = ({
  start,
}: {
  start: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
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
      onClick={start}
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
};

export interface GuidedTourProps {
  handleCallback?: (data: CallBackProps) => void;
  run: boolean;
  steps: Step[];
  stepIndex: number;
  mainKey: number;
  showProgress?: boolean;
}

export const GuidedTour = ({
  handleCallback,
  run,
  steps,
  stepIndex,
  mainKey,
  showProgress = true,
}: GuidedTourProps) => {
  return (
    <Joyride
      callback={handleCallback}
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      key={mainKey}
      continuous
      scrollToFirstStep
      showSkipButton={false}
      spotlightPadding={1}
      spotlightClicks
      showProgress={showProgress}
      styles={{
        options: {
          primaryColor: "rgb(255, 140, 0)",
          zIndex: 999999,
        },
        
        tooltip: {
          fontFamily: "Guardian Agate Sans",
          textAlign: "left",
          fontSize: 14,
        },
        tooltipContent: {
          textAlign: "left",
        },
        tooltipFooter: {
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: 0,
          margin: 0,
        },
        buttonNext: {
          fontSize: "14px",
          fontFamily: "Guardian Agate Sans",
        },
        buttonBack: {
          fontSize: "14px",
          fontFamily: "Guardian Agate Sans",
        },
        buttonClose: {
          fontSize: "14px",
          fontFamily: "Guardian Agate Sans",
        },
        buttonSkip: {
          fontSize: "14px",
          fontFamily: "Guardian Agate Sans",
        },
      }}
    />
  );
};
