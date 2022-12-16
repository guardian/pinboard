import { GrafanaRequest } from "../../../shared/types/grafanaType";
import { getUniqueUsersPerHourInRange } from "../sql/Item";
import { Sql } from "../../../shared/database/types";

export const getMetrics = async (sql: Sql, grafanaRequest: GrafanaRequest) => {
  console.log(`processing grafana request`, grafanaRequest);

  return getUniqueUsersPerHourInRange(sql, grafanaRequest.range);
};
