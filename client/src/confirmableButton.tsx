import { css } from "@emotion/react";
import { space } from "@guardian/source-foundations";
import React, { useState } from "react";
import { composer } from "../colours";
import { agateSans } from "../fontNormaliser";

interface ConfirmableButtonProps {
  label: string;
  backgroundColor: string;
  onClick: () => void;
}

export const ConfirmableButton = ({
  label,
  backgroundColor,
  onClick,
}: ConfirmableButtonProps) => {
  const [isConfirmingMode, setIsConfirmingMode] = useState(false);
  const buttonColor = isConfirmingMode
    ? composer.warning[300]
    : backgroundColor;

  return (
    <div
      css={css`
        display: flex;
        gap: ${space[1]}px;
      `}
    >
      <button
        css={css`
          display: flex;
          flex-direction: row;
          padding: ${space[1]}px;
          color: #ffffff;
          cursor: pointer;
          width: 100%;
          border-radius: ${space[1]}px;
          border: 1px solid ${buttonColor};
          width: auto;
          background-color: ${buttonColor};
          ${agateSans.xxsmall({ fontWeight: "bold" })};
        `}
        onClick={() =>
          isConfirmingMode ? onClick() : setIsConfirmingMode(true)
        }
      >
        {isConfirmingMode ? "Click again to confirm" : label}
      </button>
      {isConfirmingMode && (
        <button
          css={css`
            display: flex;
            flex-direction: row;
            padding: ${space[1]}px;
            cursor: pointer;
            width: 100%;
            border-radius: ${space[1]}px;
            border: 1px solid;
            width: auto;
            ${agateSans.xxsmall({ fontWeight: "bold" })};
          `}
          onClick={() => setIsConfirmingMode(false)}
        >
          Cancel
        </button>
      )}
    </div>
  );
};
