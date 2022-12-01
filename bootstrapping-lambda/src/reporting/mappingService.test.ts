import { GrafanaRequest } from "./grafanaType";
import {
  mapAppSyncResponseToGrafanaFormat,
  mapGrafanaRequestToAppSyncQuery,
} from "./mappingService";

describe("mappingService", () => {
  describe("mapGrafanaRequestToAppSyncQuery", () => {
    test("should map a valid request an app sync query", () => {
      const expectedQuery = {
        query:
          "query MyQuery($range: Range!) {getUniqueUsersPerHourInRange(range: $range)}",
        variables: {
          range: {
            from: "2020-10-01T00:00:00.000Z",
            to: "2020-10-02T00:00:00.000Z",
          },
        },
        operation: "MyQuery",
      };
      const request: GrafanaRequest = {
        range: {
          from: "2020-10-01T00:00:00.000Z",
          to: "2020-10-02T00:00:00.000Z",
        },
        targets: [
          {
            target: "uniqueUsers",
            type: "timeserie",
          },
        ],
      };
      expect(mapGrafanaRequestToAppSyncQuery(request)).toEqual(expectedQuery);
    });
  });

  describe("mapAppSyncResponseToGrafanaFormat", () => {
    test("should map an AppSync response to a valid Grafana format", () => {
      const mockAppSyncResponse = [
        { hour: "2022-11-24T12:00:00.000Z", uniqueUsers: "1" },
        { hour: "2022-11-28T10:00:00.000Z", uniqueUsers: "3" },
      ];
      expect(
        mapAppSyncResponseToGrafanaFormat(JSON.stringify(mockAppSyncResponse))
      ).toEqual({
        target: "uniqueUsers",
        datapoints: [
          [1, 1679992000000],
          [3, 1680384000000],
        ],
      });
    });
  });
});
