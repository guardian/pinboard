import fetch from "node-fetch";
import {
  pinboardSecretPromiseGetter,
  STAGE,
} from "../../shared/awsIntegration";
import type { GridSummary } from "../../shared/graphql/graphql";

export const handler = async (event: { arguments?: { apiUrl?: string } }) => {
  if (event.arguments?.apiUrl) {
    return getSearchSummary(event.arguments.apiUrl);
  }
};

const gridFetch = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "X-Gu-Media-Key": await pinboardSecretPromiseGetter(
        `grid/${STAGE === "PROD" ? "PROD" : "CODE"}/apiKey`
      ),
    },
  });

  // TODO stricter type
  return (await response.json()) as any;
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

  return {
    total: searchResponse.total,
    thumbnails: searchResponse.data?.map(
      (image: any /*TODO stricter type*/) =>
        image?.data?.thumbnail?.secureUrl || image?.data?.thumbnail?.file
    ),
  };
};
