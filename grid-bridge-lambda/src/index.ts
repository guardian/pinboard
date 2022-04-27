import fetch from "node-fetch";
import {
  pinboardSecretPromiseGetter,
  STAGE,
} from "../../shared/awsIntegration";
import type {
  GridSearchQueryBreakdown,
  GridSearchSummary,
} from "../../shared/graphql/graphql";

import { isCollectionResponse, isSearchResponse } from "./types";

const gutoolsDomain =
  STAGE === "PROD" ? "gutools.co.uk" : "test.dev-gutools.co.uk";
const mediaApiDomain = `api.media.${gutoolsDomain}`;
const collectionsDomain = `media-collections.${gutoolsDomain}`;
const maxImagesInSummary = "4";

export const handler = async (event: { arguments?: { apiUrl?: string } }) => {
  if (event.arguments?.apiUrl) {
    return getSearchSummary(event.arguments.apiUrl);
  }
};

const gridFetch = async (url: string): Promise<unknown> => {
  const response = await fetch(url, {
    headers: {
      "X-Gu-Media-Key": await pinboardSecretPromiseGetter(
        `grid/${STAGE === "PROD" ? "PROD" : "CODE"}/apiKey`
      ),
    },
  });

  return await response.json();
};

const getSearchSummary = async (url: string): Promise<GridSearchSummary> => {
  const parsedUrl = new URL(url);

  if (
    parsedUrl.hostname !== mediaApiDomain ||
    parsedUrl.pathname !== "/images"
  ) {
    throw new Error("Invalid Grid search API URL");
  }
  parsedUrl.searchParams.set("length", maxImagesInSummary);

  // Run api calls in parallel
  const search = gridFetch(parsedUrl.href);
  const queryBreakdown = breakdownQuery(parsedUrl.searchParams.get("q"));

  const searchResponse = await search;

  if (!isSearchResponse(searchResponse)) {
    throw new Error("Search response did not match expected shape");
  }

  const thumbnails = searchResponse?.data
    .map(
      (image) => image.data?.thumbnail?.secureUrl || image.data?.thumbnail?.file
    )
    .filter((thumbnail): thumbnail is string => !!thumbnail);

  return {
    total: searchResponse.total,
    thumbnails,
    queryBreakdown: await queryBreakdown,
  };
};

const COLLECTIONS = /~(?:([^'"\s]+)|"([^"]+)"|'([^']+)')/g;
const LABELS = /#(?:([^'"\s]+)|"([^"]+)"|'([^']+)')/g;
async function breakdownQuery(
  q: string | null
): Promise<GridSearchQueryBreakdown | null> {
  if (!q) return null;

  const collections = await Promise.all(
    [...q.matchAll(COLLECTIONS)].map(async (_) => {
      const text = _[1] ?? _[2] ?? _[3];
      const collectionResponse = await gridFetch(
        `https://${collectionsDomain}/collections/${text}`
      );

      if (!isCollectionResponse(collectionResponse)) {
        throw new Error("Fetching collection response failed as ");
      }
      return {
        text: collectionResponse.data.fullPath.join("/"),
        color: collectionResponse.data.cssColour ?? "#555",
      };
    })
  );
  const labels = [...q.matchAll(LABELS)].map((_) => ({
    text: _[1] ?? _[2] ?? _[3],
    color: "#00adee",
  }));
  const restOfSearch = q.replace(COLLECTIONS, "").replace(LABELS, "");

  return {
    collections,
    labels,
    restOfSearch,
  };
}
