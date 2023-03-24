import { Stage } from "../types/stage";
import { APP } from "../constants";

export const DATABASE_USERNAME = APP;

export const DATABASE_PORT = 5432;

export const DATABASE_NAME = APP;

export const getDatabaseProxyName = (stage: Stage) =>
  `${APP}-database-proxy-${stage}`;

export const getDatabaseJumpHostAsgName = (stage: Stage) =>
  `pinboard-database-jump-host-ASG-${stage}`;

export const NOTIFICATIONS_DATABASE_TRIGGER_NAME =
  "trigger_notifications_lambda_after_item_insert_if_applicable";
