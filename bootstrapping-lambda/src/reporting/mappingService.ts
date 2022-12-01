import { GrafanaRequest } from "./grafanaType";
import { AppSyncQuery } from "../appSyncClient";

export const mapGrafanaRequestToAppSyncQuery = (
  request: GrafanaRequest
): AppSyncQuery => {
  const {
    range: { from, to },
  } = request;

  return {
    query:
      "query MyQuery($range: Range!) {getUniqueUsersPerHourInRange(range: $range)}",
    variables: {
      range: {
        from,
        to,
      },
    },
    operation: "MyQuery",
  } as AppSyncQuery;
};

export interface GrafanaResponseFormat {
  target: string;
  datapoints: [number, number][];
}

export const mapAppSyncResponseToGrafanaFormat = (
  appSyncJsonResponse: string
): GrafanaResponseFormat[] => {
  return [{ target: "uniqueUsers", datapoints: [] }];
};
