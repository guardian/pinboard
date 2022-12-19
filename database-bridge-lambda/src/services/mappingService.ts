import { DatabaseUniqueUserResponse } from "../../../shared/types/grafanaType";

export interface GrafanaResponseFormat {
  target: string;
  datapoints: [number, number][];
}

export const mapDatabaseResponseToGrafanaFormat = (
  databaseResponse: DatabaseUniqueUserResponse[]
): [number, number][] => {
  return databaseResponse.map((item: DatabaseUniqueUserResponse) => [
    parseInt(item.uniqueUsers),
    Date.parse(item.hour),
  ]);
};
