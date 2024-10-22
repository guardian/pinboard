import * as Sentry from "@sentry/react";

const payloadTypes = [
  "grid-crop",
  "grid-original",
  "grid-search",
  "mam-video",
  "newswires-snippet",
] as const;

export type PayloadType = (typeof payloadTypes)[number];
const isPayloadType = (payloadType: string): payloadType is PayloadType => {
  return payloadTypes.includes(payloadType as PayloadType);
};

interface PayloadCommon {
  embeddableUrl: string;
}

export interface PayloadWithThumbnail extends PayloadCommon {
  thumbnail: string;
  aspectRatio?: string;
  cropType?: string;
}

export interface PayloadWithExternalUrl extends PayloadWithThumbnail {
  externalUrl: string;
}

export interface PayloadWithApiUrl extends PayloadCommon {
  apiUrl: string;
}

export interface PayloadWithSnippet extends PayloadCommon {
  embeddableHtml: string;
}

type Payload =
  | PayloadWithThumbnail
  | PayloadWithApiUrl
  | PayloadWithExternalUrl
  | PayloadWithSnippet;
const isPayload = (maybePayload: unknown): maybePayload is Payload => {
  return (
    typeof maybePayload === "object" &&
    maybePayload !== null &&
    "embeddableUrl" in maybePayload &&
    ("thumbnail" in maybePayload ||
      "apiUrl" in maybePayload ||
      "embeddableHtml" in maybePayload)
  );
};

export type StaticGridPayload = {
  type: "grid-original" | "grid-crop";
  payload: PayloadWithThumbnail;
};

export type DynamicGridPayload = {
  type: "grid-search";
  payload: PayloadWithApiUrl;
};

export type MamVideoPayload = {
  type: "mam-video";
  payload: PayloadWithExternalUrl;
};

export type NewswiresSnippetPayload = {
  type: "newswires-snippet";
  payload: PayloadWithSnippet;
};

export type PayloadAndType =
  | StaticGridPayload
  | DynamicGridPayload
  | MamVideoPayload
  | NewswiresSnippetPayload;

export const buildPayloadAndType = (
  type: string,
  payload: unknown
): PayloadAndType | undefined => {
  if (!(isPayloadType(type) && isPayload(payload))) return;

  if (type === "grid-search" && "apiUrl" in payload) {
    return { type, payload };
  } else if (
    (type === "grid-crop" || type === "grid-original") &&
    "thumbnail" in payload
  ) {
    return { type, payload };
  } else if (
    type === "mam-video" &&
    "thumbnail" in payload &&
    "externalUrl" in payload
  ) {
    return { type, payload };
  } else if (
    type === "newswires-snippet" &&
    "embeddableHtml" in payload &&
    "embeddableUrl" in payload
  ) {
    return { type, payload };
  }
};

export const maybeConstructPayloadAndType = (
  type: string,
  payload: string | null | undefined
): PayloadAndType | undefined => {
  if (!isPayloadType(type) || !payload) {
    return;
  }

  const payloadAndType = buildPayloadAndType(type, JSON.parse(payload));

  if (!payloadAndType) {
    Sentry.captureException(
      new Error(`Failed to parse payload with type=${type}, payload=${payload}`)
    );
  }

  return payloadAndType;
};
