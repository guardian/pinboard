import { GrafanaRequest } from "./grafanaType";
import { AppSyncQuery } from "../appSyncClient";

export const mapQuery = (request: GrafanaRequest): AppSyncQuery => {
  const { range } = request;

  return {
    query: "query MyQuery($range: Range) {getUniqueUsers(range: $range) {}}",
    variables: {
      range: range,
    },
    operation: "MyQuery",
  } as AppSyncQuery;
};
