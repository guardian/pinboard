import { GrafanaRequest } from "./grafanaType";
import { mapQuery } from "./queryMappingService";

describe("queryMappingService", () => {
  test("should map a valid request an app sync query", () => {
    const expectedQuery = {
      query: "query MyQuery($range: Range) {getUniqueUsers(range: $range) {}}",
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
    expect(mapQuery(request)).toEqual(expectedQuery);
  });
});
