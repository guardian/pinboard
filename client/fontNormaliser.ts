import type {
  FontScaleArgs,
  FontScaleFunctionStr,
} from "@guardian/source-foundations/dist/types/typography/types";

// eslint-disable-next-line no-restricted-imports -- suppress our own lint rule as this is the one legit place to import the fonts
import * as sourceFoundations from "@guardian/source-foundations";

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

export const textSans = pixelSizedFont(sourceFoundations.textSans);
export const headline = pixelSizedFont(sourceFoundations.headline);
export const titlepiece = pixelSizedFont(sourceFoundations.titlepiece);
export const body = pixelSizedFont(sourceFoundations.body);
