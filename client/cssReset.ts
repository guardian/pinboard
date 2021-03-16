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
  * {
    ${textSans.small()}
    color: ${pinMetal};
    margin: 0;
    padding: 0; 
    border: none;  
  }

  h4 {
    ${textSans.medium()}
    font-weight: 700;
    margin: ${space[1]}px 0;
    padding: 0;  
  }
`;
