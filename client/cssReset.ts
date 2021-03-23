import { css } from "@emotion/react";
import { space } from "@guardian/src-foundations";
import {
  FontScaleArgs,
  FontScaleFunctionStr,
} from "@guardian/src-foundations/dist/types/typography/types";
// eslint-disable-next-line node/no-restricted-import
import * as typography from "@guardian/src-foundations/typography";
import { pinMetal } from "./colours";

const defaultToPx = (originalFunc: FontScaleFunctionStr) => (
  options?: FontScaleArgs
) => originalFunc({ unit: "px", ...options });

type FontDefinition = { [fontSizeName: string]: FontScaleFunctionStr };

const pixelSizedFont = <T extends FontDefinition>(originalFont: T) =>
  Object.entries(originalFont).reduce(
    (acc, [fontSizeName, fontScaleFunc]) => ({
      ...acc,
      [fontSizeName]: defaultToPx(fontScaleFunc),
    }),
    {} as T
  );

export const textSans = pixelSizedFont(typography.textSans);
export const headline = pixelSizedFont(typography.headline);
export const titlepiece = pixelSizedFont(typography.titlepiece);
export const body = pixelSizedFont(typography.body);

export const cssReset = css`
  ${textSans.small()}
  color: ${pinMetal};

  * {
    margin: revert;
    padding: revert;
    border: revert;
    background: revert;
  }

  h4 {
    margin: revert;
    padding: revert;
    font: revert;
  }

  textarea,
  input {
    color: revert;
    border: revert;
    border-radius: revert;
    padding: revert;
    :focus {
      outline: revert;
    }
    ::placeholder {
      color: revert;
    }
  }
`;
