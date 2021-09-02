import { Response } from "express";

const setCacheControlHeader = (response: Response, value: string): Response =>
  response.header("Cache-Control", value);

export const applyAggressiveCaching = (response: Response): void => {
  setCacheControlHeader(response, "public, max-age=604800, immutable");
};

export const applyNoCaching = (response: Response): void => {
  setCacheControlHeader(
    response,
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
};

export const applyJavascriptContentType = (response: Response): Response =>
  response.header("Content-Type", "application/javascript");
