import { extractGridQueryParts } from "../src/extractGridQueryParts";

describe("extractGridQueryParts ", () => {
  it("should extract a label", () => {
    expect(extractGridQueryParts("#Test1")).toEqual({
      collections: [],
      labels: ["Test1"],
      freeTextSearch: null,
    });
  });
  it("should extract a collection", () => {
    expect(extractGridQueryParts(`~"g1/pinboard"`)).toEqual({
      collections: ["g1/pinboard"],
      labels: [],
      freeTextSearch: null,
    });
  });
  it("should extract a free text search", () => {
    expect(extractGridQueryParts("pin")).toEqual({
      collections: [],
      labels: [],
      freeTextSearch: "pin",
    });
  });
});
