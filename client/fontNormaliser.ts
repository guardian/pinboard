import type {
  FontScaleArgs,
  FontScaleFunctionStr,
} from "@guardian/src-foundations/dist/types/typography/types";
// eslint-disable-next-line node/no-restricted-import
import * as typography from "@guardian/src-foundations/typography";

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
