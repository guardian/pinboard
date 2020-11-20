import {Response} from "express";

const setCacheControlHeader = (_: Response, value: string) =>
  _.header("Cache-Control", value);

export const applyAggressiveCaching = (_: Response) => {
  setCacheControlHeader(_, "public, max-age=604800, immutable")
};

export const applyNoCaching = (_: Response) => {
  setCacheControlHeader(_, "private, no-cache, no-store, must-revalidate, max-age=0")
};

export const applyJavascriptContentType = (_: Response) =>
  _.header("Content-Type", "application/javascript");