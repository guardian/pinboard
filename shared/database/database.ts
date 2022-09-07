import { Stage } from "../types/stage";
import { APP } from "../constants";

export const DATABASE_USERNAME = APP;

export const DATABASE_PORT = 5432;

export const DATABASE_NAME = APP;

export const getDatabaseProxyName = (stage: Stage) =>
  `${APP}-database-proxy-${stage}`;

export const databaseJumpHostASGLogicalID = "DatabaseJumpHostASG";

export const getDatabaseJumpHostAsgName = (stage: Stage) =>
  `pinboard-database-jump-host-ASG-${stage}`;
