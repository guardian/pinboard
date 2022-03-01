import type {
  FontScaleArgs,
  FontScaleFunctionStr,
} from "@guardian/source-foundations/dist/types/typography/types";

// eslint-disable-next-line no-restricted-imports -- suppress our own lint rule as this is the one legit place to import the fonts
import * as sourceFoundations from "@guardian/source-foundations";

type FontOverride = (
  originalFunc: FontScaleFunctionStr
) => (options?: FontScaleArgs | undefined) => string;

// source foundations will give us Guardian Text Sans, but we usually want Guardian Agate Sans, so as to fit in with
// the tools hosting pinboard.
// different tools provide Agate Sans either with or without the Web suffix, so use fallbacks to try both.
const overrideToAgateSans: FontOverride = (
  originalFunc: FontScaleFunctionStr
) => (options?: FontScaleArgs) => `
  ${originalFunc(options)};
  font-family: "Guardian Agate Sans", "Guardian Agate Sans Web", Arial, sans-serif;
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

const agateSansFont = applyFontOverride(overrideToAgateSans);
const pixelSizedFont = applyFontOverride(defaultToPx);

export const agateSans = agateSansFont(
  pixelSizedFont(sourceFoundations.textSans)
);
export const textSans = pixelSizedFont(sourceFoundations.textSans);
export const headline = pixelSizedFont(sourceFoundations.headline);
export const titlepiece = pixelSizedFont(sourceFoundations.titlepiece);
export const body = pixelSizedFont(sourceFoundations.body);
