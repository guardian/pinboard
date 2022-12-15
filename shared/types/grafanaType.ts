export interface Range {
  from: string;
  to: string;
}

type TargetType = "timeserie" | "table";

interface Target {
  target: string;
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
