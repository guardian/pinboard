import type {
  FontScaleArgs,
  FontScaleFunctionStr,
} from "@guardian/source-foundations/dist/types/typography/types";

// eslint-disable-next-line no-restricted-imports -- suppress our own lint rule as this is the one legit place to import the fonts
import * as sourceFoundations from "@guardian/source-foundations";
import { css } from "@emotion/react";

type FontOverride = (
  originalFunc: FontScaleFunctionStr
) => (options?: FontScaleArgs | undefined) => string;

// source foundations will give us Guardian Text Sans, but we usually want Open Sans, to fit in with the tools hosting pinboard.
const overrideToOpenSans: FontOverride = (
  originalFunc: FontScaleFunctionStr
) => (options?: FontScaleArgs) => `
  ${originalFunc(options)};
  font-family: "Open Sans", Arial, sans-serif;
`;

const defaultToPx: FontOverride = (originalFunc: FontScaleFunctionStr) => (
  options?: FontScaleArgs
) => originalFunc({ unit: "px", ...options });

type FontDefinition = { [fontSizeName: string]: FontScaleFunctionStr };

const applyFontOverride = <T extends FontDefinition>(
  fontOverride: FontOverride
) => (originalFont: T) =>
  Object.entries(originalFont).reduce(
    (acc, [fontSizeName, fontScaleFunc]) => ({
      ...acc,
      [fontSizeName]: fontOverride(fontScaleFunc),
    }),
    {} as T
  );

const openSansFont = applyFontOverride(overrideToOpenSans);
const pixelSizedFont = applyFontOverride(defaultToPx);

export const openSans = openSansFont(
  pixelSizedFont(sourceFoundations.textSans)
);
// export const textSans = pixelSizedFont(sourceFoundations.textSans);
// export const headline = pixelSizedFont(sourceFoundations.headline);
// export const titlepiece = pixelSizedFont(sourceFoundations.titlepiece);
// export const body = pixelSizedFont(sourceFoundations.body);

export const fontFaceOpenSansCSS = css`
  @import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap");

  @font-face {
    font-family: "Open Sans";
    font-stretch: 87.5%;
  }
`;
