export const IMAGING_REQUEST_ITEM_TYPE = "imaging-request";
export const IMAGING_PICKED_UP_ITEM_TYPE = "imaging-picked-up"; // TODO consider using "claim" instead OR make all the 'claim' behaviour (both display and write) respect this type
export const IMAGING_COMPLETED_ITEM_TYPE = "imaging-completed";

export const IMAGINE_REQUEST_TYPES = [
  "Cut out", // only 'cut out' is required for now
  // "Break out",
  // "Retouch",
] as const;

export type ImagingRequestType = (typeof IMAGINE_REQUEST_TYPES)[number];
