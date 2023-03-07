import { Stage } from "./types/stage";

export const APP = "pinboard";

export const publicVapidKey =
  "BAJ1E479bw4iqDH3nTg-OhzLw1daQ9Hfn6EY0x40M9AXGgEew4dBpAb_LE35plZ6YhU2VY87LLJtytE7hJKP9GM";

export const MAX_PINBOARDS_TO_DISPLAY = 25;

export const NOTIFICATIONS_LAMBDA_BASENAME = "pinboard-notifications-lambda";
export const getNotificationsLambdaFunctionName = (stage: Stage) =>
  `${NOTIFICATIONS_LAMBDA_BASENAME}-${stage}`;

export const DATABASE_BRIDGE_LAMBDA_BASENAME =
  "pinboard-database-bridge-lambda";
export const getDatabaseBridgeLambdaFunctionName = (stage: Stage) =>
  `${DATABASE_BRIDGE_LAMBDA_BASENAME}-${stage}`;

export const WORKFLOW_BRIDGE_LAMBDA_BASENAME =
  "pinboard-workflow-bridge-lambda";
export const getWorkflowBridgeLambdaFunctionName = (stage: Stage) =>
  `${WORKFLOW_BRIDGE_LAMBDA_BASENAME}-${stage}`;

// FIXME we should probably 'eat' these query params once used (using `history.replaceState`)
export const OPEN_PINBOARD_QUERY_PARAM = "pinboardId";
export const PINBOARD_ITEM_ID_QUERY_PARAM = "pinboardItemId";
export const EXPAND_PINBOARD_QUERY_PARAM = "expandPinboard";
