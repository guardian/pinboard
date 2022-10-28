import { Stage } from "./types/stage";

export const APP = "pinboard";

export const publicVapidKey =
  "BAJ1E479bw4iqDH3nTg-OhzLw1daQ9Hfn6EY0x40M9AXGgEew4dBpAb_LE35plZ6YhU2VY87LLJtytE7hJKP9GM";

export const MAX_PINBOARDS_TO_DISPLAY = 25;

export const NOTIFICATIONS_LAMBDA_BASENAME = "pinboard-notifications-lambda";
export const getNotificationsLambdaFunctionName = (stage: Stage) =>
  `${NOTIFICATIONS_LAMBDA_BASENAME}-${stage}`;

export const OPEN_PINBOARD_QUERY_PARAM = "pinboardId";
export const PINBOARD_ITEM_ID_QUERY_PARAM = "pinboardItemId";
export const EXPAND_PINBOARD_QUERY_PARAM = "expandPinboard";
