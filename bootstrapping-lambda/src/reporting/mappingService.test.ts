import { mapDatabaseResponseToGrafanaFormat } from "./mappingService";

describe("mappingService", () => {
  describe("mapAppSyncResponseToGrafanaFormat", () => {
    test("should map an AppSync response to a valid Grafana format", () => {
      const mockAppSyncResponse = [
        { hour: "2022-11-24T12:00:00.000Z", uniqueUsers: "1" },
        { hour: "2022-11-28T10:00:00.000Z", uniqueUsers: "3" },
      ];
      expect(mapDatabaseResponseToGrafanaFormat(mockAppSyncResponse)).toEqual([
        {
          target: "uniqueUsers",
          datapoints: [
            [1, 1669291200000],
            [3, 1669629600000],
          ],
        },
      ]);
    });

    test("should return an empty response to an empty response", () => {
      expect(mapDatabaseResponseToGrafanaFormat([])).toEqual([
        {
          target: "uniqueUsers",
          datapoints: [],
        },
      ]);
    });
  });
});
