import { GrafanaRequest } from "./grafanaType";
import { AppSyncQuery } from "../appSyncClient";

export const mapQuery = (request: GrafanaRequest): AppSyncQuery => {
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
