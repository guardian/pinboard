import { GrafanaRequest } from "./grafanaType";
import { AppSyncQuery } from "../appSyncClient";

export const mapQuery = (request: GrafanaRequest): AppSyncQuery => {
  const { range, targets } = request;

  return {
    query:
      "query MyQuery($range: Range, $metric: String) {getMetricsForRange(range: $range, metric: $metric) {}}",
    variables: {
      range: range,
      metric: targets[0].target,
    },
    operation: "MyQuery",
  } as AppSyncQuery;
};
