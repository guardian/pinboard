import { DatabaseUniqueUserResponse } from "../../../shared/types/grafanaType";

export interface GrafanaResponseFormat {
  target: string;
  datapoints: [number, number][];
}

export const mapDatabaseResponseToGrafanaFormat = (
  databaseResponse: DatabaseUniqueUserResponse[]
): GrafanaResponseFormat[] => {
  const mappedResponseObjects = databaseResponse.map(
    (item: DatabaseUniqueUserResponse) =>
      [parseInt(item.uniqueUsers), Date.parse(item.hour)] as [number, number]
  );

  return [{ target: "uniqueUsers", datapoints: mappedResponseObjects }];
};
