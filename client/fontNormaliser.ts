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

// different tools provide Agate Sans either with or without the Web suffix, so use fallbacks to try both.
const agateFontNameVariants = [
  "Guardian Agate Sans",
  "Guardian Agate Sans Web",
  "GuardianAgateSans1Web",
];

export const agateFontFamily = `${agateFontNameVariants
  .map((_) => `"${_}"`)
  .join(",")}, Arial, sans-serif;`;

// source foundations will give us Guardian Text Sans, but we usually want Guardian Agate Sans, so as to fit in with
// the tools hosting pinboard.
const overrideToAgateSans: FontOverride =
  (originalFunc: FontScaleFunctionStr) => (options?: FontScaleArgs) =>
    `
  ${originalFunc(options)};
  font-family: ${agateFontFamily};
`;

const defaultToPx: FontOverride =
  (originalFunc: FontScaleFunctionStr) => (options?: FontScaleArgs) =>
    originalFunc({ unit: "px", ...options });

type FontDefinition = { [fontSizeName: string]: FontScaleFunctionStr };

const applyFontOverride =
  <T extends FontDefinition>(fontOverride: FontOverride) =>
  (originalFont: T) =>
    Object.entries(originalFont).reduce(
      (acc, [fontSizeName, fontScaleFunc]) => ({
        ...acc,
        [fontSizeName]: fontOverride(fontScaleFunc),
      }),
      {} as T
    );

const agateSansFont = applyFontOverride(overrideToAgateSans);
const pixelSizedFont = applyFontOverride(defaultToPx);

export const agateSans = agateSansFont(
  pixelSizedFont(sourceFoundations.textSans)
);
export const textSans = pixelSizedFont(sourceFoundations.textSans);

const isAgateLoaded = () => {
  let foundAgate = false;
  document.fonts.forEach((font) => {
    if (agateFontNameVariants.includes(font.family)) {
      foundAgate = true;
    }
  });
  return foundAgate;
};
const agateFontFileBasePath =
  "https://interactive.guim.co.uk/fonts/guss-webfonts/GuardianAgateSans1Web/GuardianAgateSans1Web-";
export const getAgateFontFaceIfApplicable = () =>
  isAgateLoaded()
    ? null
    : css`
        @font-face {
          font-family: "Guardian Agate Sans";
          src: url("${agateFontFileBasePath}Regular.woff2") format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: "Guardian Agate Sans";
          src: url("${agateFontFileBasePath}Bold.woff2") format("woff2");
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: "Guardian Agate Sans";
          src: url("${agateFontFileBasePath}RegularItalic.woff2")
            format("woff2");
          font-weight: 400;
          font-style: italic;
          font-display: swap;
        }
        @font-face {
          font-family: "Guardian Agate Sans";
          src: url("${agateFontFileBasePath}BoldItalic.woff2") format("woff2");
          font-weight: 700;
          font-style: italic;
          font-display: swap;
        }
      `;
