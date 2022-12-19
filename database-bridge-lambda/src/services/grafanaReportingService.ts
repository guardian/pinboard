import {
  DatabaseUniqueUserResponse,
  MetricRequest,
} from "../../../shared/types/grafanaType";
import { getUniqueUsersPerHourInRange } from "../sql/Item";
import { Sql } from "../../../shared/database/types";
import { mapDatabaseResponseToGrafanaFormat } from "./mappingService";

export const getMetrics = async (sql: Sql, metricRequest: MetricRequest) => {
  console.log(`processing grafana request`, metricRequest);
  const {
    target: { target },
  } = metricRequest;
  switch (target) {
    case "uniqueUsersCode":
    case "uniqueUsersProd": {
      const databaseResponse = await getUniqueUsersPerHourInRange(
        sql,
        metricRequest.range
      );
      return mapDatabaseResponseToGrafanaFormat(
        (databaseResponse as unknown) as DatabaseUniqueUserResponse[]
      );
    }
    default:
      throw Error(
        `No handler for '${target}' target. @typescript-eslint/switch-exhaustiveness-check should have caught this`
      );
  }
};
