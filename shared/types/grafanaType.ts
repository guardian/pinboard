export interface Range {
  from: string;
  to: string;
}

type TargetType = "timeserie" | "table";

export enum Metric {
  UNIQUE_USERS = "uniqueUsers",
}

export interface Target {
  target: Metric;
  type: TargetType;
}

export interface GrafanaRequest {
  range: Range;
  targets: Target[];
}

export interface DatabaseUniqueUserResponse {
  hour: string;
  uniqueUsers: string;
}
