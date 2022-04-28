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

// Find a word, or a quoted phrase.
// Only handles straight quotes (' or ").
// Capture groups trim the quotes off the phrase
const extractQueryWordOrPhrase = `(?:([^'"\\s]+)|"([^"]+)"|'([^']+)')`;

const COLLECTIONS = new RegExp(`~${extractQueryWordOrPhrase}`, "g");
const LABELS = new RegExp(`#${extractQueryWordOrPhrase}`, "g");
const CHIPS = new RegExp(`([^'"\\s]+):${extractQueryWordOrPhrase}`, "g");

async function breakdownQuery(
  q: string | null
): Promise<GridSearchQueryBreakdown | null> {
  if (!q) return null;

  const collections = await Promise.all(
    [...q.matchAll(COLLECTIONS)].map(async (match) => {
      const text = match[1] ?? match[2] ?? match[3];
      const collectionResponse = await gridFetch(
        `https://${collectionsDomain}/collections/${text}`
      );

      if (!isCollectionResponse(collectionResponse)) {
        throw new Error("Fetching collection response failed to parse");
      }
      return {
        text: collectionResponse.data.fullPath.join("/"),
        color: collectionResponse.data.cssColour ?? "#555",
      };
    })
  );
  const notCollections = q.replace(COLLECTIONS, "");

  const labels = [...notCollections.matchAll(LABELS)].map((match) => ({
    text: match[1] ?? match[2] ?? match[3],
    color: "#00adee",
  }));
  const notLabels = notCollections.replace(LABELS, "");

  const chips = [...notLabels.matchAll(CHIPS)].map((match) => ({
    text: match[1] + ":" + (match[2] ?? match[3] ?? match[4]),
    color: "#333333",
  }));
  const notChips = notLabels.replace(CHIPS, "");

  // flatten any remaining sequence of spaces into a single
  const restOfSearch = notChips.replace(/ {2,}/g, " ").trim();

  return {
    collections,
    labels,
    chips,
    restOfSearch,
  };
}
