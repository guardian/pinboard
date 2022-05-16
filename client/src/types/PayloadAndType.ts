export const sources = ["grid"] as const;
export const sourceTypes = ["crop", "original", "search"] as const;

export type Source = typeof sources[number];
export const isSource = (source: unknown): source is Source =>
  sources.includes(source as Source);
export type SourceType = typeof sourceTypes[number];
export const isSourceType = (sourceType: unknown): sourceType is SourceType =>
  sourceTypes.includes(sourceType as SourceType);

export type PayloadType = `${Source}-${SourceType}`;
export const isPayloadType = (
  payloadType: string
): payloadType is PayloadType => {
  const parts = payloadType.split("-");
  return parts.length === 2 && isSource(parts[0]) && isSourceType(parts[1]);
};

interface PayloadCommon {
  embeddableUrl: string;
}

export interface PayloadWithThumbnail extends PayloadCommon {
  thumbnail: string;
}

export interface PayloadWithApiUrl extends PayloadCommon {
  apiUrl: string;
}

export type Payload = PayloadWithThumbnail | PayloadWithApiUrl;
export const isPayload = (maybePayload: unknown): maybePayload is Payload => {
  return (
    typeof maybePayload === "object" &&
    maybePayload !== null &&
    "embeddableUrl" in maybePayload &&
    ("thumbnail" in maybePayload || "apiUrl" in maybePayload)
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

export type PayloadAndType = StaticGridPayload | DynamicGridPayload;

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
  }
};
