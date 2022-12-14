export const IMAGING_REQUEST_ITEM_TYPE = "imaging-request";

export const IMAGINE_REQUEST_TYPES = [
  "Cut out", // only 'cut out' is required for now
  // "Break out",
  // "Retouch",
] as const;

export type ImagingRequestType = (typeof IMAGINE_REQUEST_TYPES)[number];
