import { palette } from "@guardian/source-foundations";

export const pinMetal = palette.neutral[20]; //"#333333"
export const composer = {
  warning: {
    [100]: "#A51B08",
    [300]: "#C7291C",
  } as const,
  primary: {
    [100]: "#014880",
    [300]: "#007ABC",
    [400]: "#239DD8",
  } as const,
} as const;
export const pinboard = {
  [500]: "#F8C502",
  [800]: "#FFF6BB",
} as const;
