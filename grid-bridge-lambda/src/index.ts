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
import { PayloadAndType } from "client/src/types/PayloadAndType";

const gutoolsDomain =
  STAGE === "PROD" ? "gutools.co.uk" : "test.dev-gutools.co.uk";
const mediaApiDomain = `api.media.${gutoolsDomain}`;
const collectionsDomain = `media-collections.${gutoolsDomain}`;
const maxImagesInSummary = "4";

export const handler = async (event: {
  arguments?: { apiUrl?: string; gridUrl?: string };
}) => {
  if (event.arguments?.apiUrl) {
    return getSearchSummary(new URL(event.arguments.apiUrl));
  }
  if (event.arguments?.gridUrl) {
    return buildPayloadFor(new URL(event.arguments.gridUrl));
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

const getSearchSummary = async (url: URL): Promise<GridSearchSummary> => {
  if (url.hostname !== mediaApiDomain || url.pathname !== "/images") {
    throw new Error("Invalid Grid search API URL");
  }
  url.searchParams.set("length", maxImagesInSummary);

  // Run api calls in parallel
  const search = gridFetch(url.href);
  const queryBreakdown = breakdownQuery(url.searchParams.get("q"));

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

async function buildPayloadFor(gridUrl: URL): Promise<PayloadAndType | null> {
  if (gridUrl.pathname === "/search") {
    const apiUrl = new URL(gridUrl.href);
    apiUrl.hostname = mediaApiDomain;
    apiUrl.pathname = apiUrl.pathname.replace("/search", "/images");
    apiUrl.searchParams.set("countAll", "true");
    apiUrl.searchParams.set("length", "0");
    const query = gridUrl.searchParams.get("query");
    if (query) {
      apiUrl.searchParams.set("q", query);
      apiUrl.searchParams.delete("query");
    }

    const embeddableUrl = new URL(gridUrl.href);
    embeddableUrl.searchParams.set("nonFree", "true");
    return {
      type: "grid-search",
      payload: {
        apiUrl: apiUrl.href,
        embeddableUrl: embeddableUrl.href,
      },
    };
  }
  if (gridUrl.pathname.startsWith("/images/")) {
    const maybeCrop = gridUrl.searchParams.get("crop");
    const apiUrl = new URL(gridUrl.href);
    apiUrl.hostname = mediaApiDomain;
    const imageResponse = (await gridFetch(apiUrl.href)) as {
      data: {
        thumbnail: { secureUrl: string };
        exports: Array<{
          id: string;
          assets: Array<{
            secureUrl: string;
            size: number;
            dimensions: { height: number; width: number };
          }>;
        }>;
      };
    }; // TODO probably define this in types.ts
    const thumbnail: string = maybeCrop
      ? imageResponse.data.exports
          .find((_) => _.id === maybeCrop)!
          .assets.sort((a, b) => a.size - b.size)[0]!.secureUrl
      : imageResponse.data.thumbnail.secureUrl;
    return {
      type: maybeCrop ? "grid-crop" : "grid-original",
      payload: {
        embeddableUrl: gridUrl.href,
        thumbnail,
      },
    };
  }
  return null;
}
