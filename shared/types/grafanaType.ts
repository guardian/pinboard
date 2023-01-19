import { Stage } from "./stage";

export interface Range {
  from: string;
  to: string;
}

// 'timeserie' is the expected type in Grafana (i.e. not a typo)
export type TargetType = "timeserie" | "table";

export enum StageMetric {
  UNIQUE_USERS_CODE = "uniqueUsersCode",
  UNIQUE_USERS_PROD = "uniqueUsersProd",
  UNIQUE_USERS = "uniqueUsers",
}

export enum Metric {
  UNIQUE_USERS = "uniqueUsers",
}

export interface customData {
  stage?: Stage;
}

export interface Target {
  target: StageMetric;
  type: TargetType;
  data?: customData;
}

export interface GrafanaRequest {
  range: Range;
  targets: Target[];
}

export interface MetricRequest {
  range: Range;
  metric: Metric;
}

export interface MetricsResponse {
  target: string;
  datapoints: [number, number][];
}

export interface DatabaseUniqueUserResponse {
  hour: string;
  uniqueUsers: string;
}
