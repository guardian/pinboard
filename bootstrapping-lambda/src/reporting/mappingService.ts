import { GrafanaRequest } from "../../../shared/types/grafanaType";
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

interface DatabaseUniqueUserResponse {
  hour: string;
  uniqueUsers: string;
}

export const mapAppSyncResponseToGrafanaFormat = (
  appSyncJsonResponse: string
): GrafanaResponseFormat[] => {
  const responseArray = JSON.parse(appSyncJsonResponse);
  const mappedResponseObjects = responseArray.map(
    (item: DatabaseUniqueUserResponse) => [
      parseInt(item.uniqueUsers),
      Date.parse(item.hour),
    ]
  );
  return [{ target: "uniqueUsers", datapoints: mappedResponseObjects }];
};
