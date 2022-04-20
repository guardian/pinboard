export interface SearchResponse {
  offset: number;
  length: number;
  total: number;
  data: ImageResponse[];
}
export const isSearchResponse = (
  possiblyResponse: any
): possiblyResponse is SearchResponse =>
  typeof possiblyResponse.offset === "number" &&
  typeof possiblyResponse.length === "number" &&
  typeof possiblyResponse.total === "number" &&
  Array.isArray(possiblyResponse.total) &&
  (possiblyResponse.total as any[]).every(isImageResponse);

export interface ImageResponse {
  uri: string;
  data: Image;
}
export const isImageResponse = (
  possiblyResponse: any
): possiblyResponse is ImageResponse =>
  typeof possiblyResponse.uri === "string" && isImage(possiblyResponse.data);

export interface Image {
  // incomplete type definition - canonical definition at https://github.com/guardian/grid/blob/main/common-lib/src/main/scala/com/gu/mediaservice/model/Image.scala
  id: GridId;
  thumbnail?: Thumbnail;
}
export const isImage = (possiblyImage: any): possiblyImage is Image =>
  isGridId(possiblyImage.id) &&
  (!("thumbnail" in possiblyImage) || isThumbnail(possiblyImage.thumbnail));

export interface Thumbnail {
  // incomplete type definition - canonical definition at https://github.com/guardian/grid/blob/main/common-lib/src/main/scala/com/gu/mediaservice/model/Asset.scala
  file: string;
  secureUrl?: string;
}
export const isThumbnail = (
  possiblyThumbnail: any
): possiblyThumbnail is Thumbnail =>
  typeof possiblyThumbnail.file === "string" &&
  ("secureUrl" in possiblyThumbnail ||
    typeof possiblyThumbnail.secureUrl === "string");

export type GridId = string;
export const isGridId = (possiblyId: string): possiblyId is GridId =>
  !!possiblyId.match(/^[0-9a-f]{40}$/i);
