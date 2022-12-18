export interface Range {
  from: string;
  to: string;
}

export type TargetType = "timeserie" | "table";

export enum Metric {
  UNIQUE_USERS_CODE = "uniqueUsersCode",
  UNIQUE_USERS_PROD = "uniqueUsersProd",
}

export interface Target {
  target: Metric;
  type: TargetType;
}

export interface GrafanaRequest {
  range: Range;
  targets: Target[];
}

export interface MetricRequest {
  range: Range;
  target: Target;
}

export interface MetricsResponse {
  target: string;
  datapoints: [number, number][];
}

export interface DatabaseUniqueUserResponse {
  hour: string;
  uniqueUsers: string;
}
