import React, { useContext, useState } from "react";
import { css } from "@emotion/react";
import { space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import Joyride, { CallBackProps, Step } from "react-joyride";

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
        <div
          css={css`
            color: white;
            a:link {
              color: white;
            }
            padding-left: ${space[1]}px;
          `}
        >
          First time on Pinboard? Start the guided tour.
        </div>
      </div>
    </button>
  );
};

interface GuidedTourProps {
  handleCallback?: (data: CallBackProps) => void;
  run: boolean;
  steps: Step[];
}

export const GuidedTour = ({ handleCallback, run, steps }: GuidedTourProps) => {
  return (
    <Joyride
      callback={handleCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: "rgb(255, 140, 0)",
        },
        tooltip: {
          fontFamily: `${agateSans.xsmall()}`, // not working
          fontSize: "14px",
          padding: `${space[3]}px`,
        },
      }}
    />
  );
};
