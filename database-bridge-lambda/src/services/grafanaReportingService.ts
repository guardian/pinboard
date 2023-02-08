import { MetricRequest } from "../../../shared/types/grafanaType";
import { getUniqueUsersPerHourInRange } from "../sql/Item";
import { Sql } from "../../../shared/database/types";

export const getMetrics = async (sql: Sql, metricRequest: MetricRequest) => {
  console.log(`processing grafana request`, metricRequest);
  const { metric } = metricRequest;
  switch (metric) {
    case "uniqueUsers": {
      return await getUniqueUsersPerHourInRange(sql, metricRequest.range);
    }
    default:
      throw Error(
        `No handler for '${metric}' target. @typescript-eslint/switch-exhaustiveness-check should have caught this`
      );
  }
};
