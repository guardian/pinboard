import fetch from "node-fetch";
import {
  pinboardSecretPromiseGetter,
  STAGE,
} from "../../shared/awsIntegration";
import type { GridSummary } from "../../shared/graphql/graphql";

import { isSearchResponse, SearchResponse } from "./types";

export const handler = async (event: { arguments?: { apiUrl?: string } }) => {
  if (event.arguments?.apiUrl) {
    return getSearchSummary(event.arguments.apiUrl);
  }
};

const gridFetch = async (url: string): Promise<SearchResponse> => {
  const response = await fetch(url, {
    headers: {
      "X-Gu-Media-Key": await pinboardSecretPromiseGetter(
        `grid/${STAGE === "PROD" ? "PROD" : "CODE"}/apiKey`
      ),
    },
  });

  const body = await response.json();
  if (isSearchResponse(body)) {
    return body;
  }
  throw new Error(
    "Response from grid was valid JSON, but did not match expected shape."
  );
};

const getSearchSummary = async (url: string): Promise<GridSummary> => {
  const parsedUrl = new URL(url);
  const expectedDomain =
    STAGE === "PROD"
      ? "api.media.gutools.co.uk"
      : "api.media.test.dev-gutools.co.uk";
  if (
    parsedUrl.hostname !== expectedDomain ||
    parsedUrl.pathname !== "/images"
  ) {
    throw new Error("Invalid Grid search API URL");
  }
  parsedUrl.searchParams.set("length", "4");
  const searchResponse = await gridFetch(parsedUrl.href);

  const thumbnails = searchResponse.data
    .map(
      (image) =>
        image?.data?.thumbnail?.secureUrl || image?.data?.thumbnail?.file
    )
    .filter((thumbnail): thumbnail is string => !!thumbnail);

  return {
    total: searchResponse.total,
    thumbnails,
  };
};
