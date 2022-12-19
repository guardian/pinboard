export interface Range {
  from: string;
  to: string;
}

export type TargetType = "timeserie" | "table";

export enum StageMetric {
  UNIQUE_USERS_CODE = "uniqueUsersCode",
  UNIQUE_USERS_PROD = "uniqueUsersProd",
}

export enum Metric {
  UNIQUE_USERS = "uniqueUsers",
}

export interface Target {
  target: StageMetric;
  type: TargetType;
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
