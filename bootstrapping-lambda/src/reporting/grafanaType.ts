interface TimeRange {
  from: string;
  to: string;
}

type TargetType = "timeserie" | "table";

interface Target {
  target: string;
  type: TargetType;
}

export interface GrafanaRequest {
  range: TimeRange;
  targets: Target[];
}
