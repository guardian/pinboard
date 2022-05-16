export interface CollectionResponse {
  data: Collection;
}
export const isCollectionResponse = (
  possiblyCollectionResponse: unknown
): possiblyCollectionResponse is CollectionResponse =>
  possiblyCollectionResponse !== null &&
  typeof possiblyCollectionResponse === "object" &&
  isCollection((possiblyCollectionResponse as CollectionResponse).data);

export interface Collection {
  // incomplete type definition - represents this json write format https://github.com/guardian/grid/blob/e669dfc4b01aa4fdfa82893d535e4a86558319b3/collections/app/controllers/CollectionsController.scala#L181-L187
  basename: string;
  fullPath: string[];
  cssColour?: string;
}
export const isCollection = (
  possiblyCollection: unknown
): possiblyCollection is Collection => {
  if (possiblyCollection !== null && typeof possiblyCollection === "object") {
    const collection = possiblyCollection as Collection;
    return (
      typeof collection.basename === "string" &&
      Array.isArray(collection.fullPath) &&
      collection.fullPath.every((path) => typeof path === "string") &&
      (collection.cssColour === undefined ||
        typeof collection.cssColour === "string")
    );
  }
  return false;
};

export interface SearchResponse {
  offset: number;
  length: number;
  total: number;
  data: ImageResponse[];
}
export const isSearchResponse = (
  possiblyResponse: unknown
): possiblyResponse is SearchResponse => {
  if (possiblyResponse !== null && typeof possiblyResponse === "object") {
    const response = possiblyResponse as SearchResponse;
    return (
      typeof response.offset === "number" &&
      typeof response.length === "number" &&
      typeof response.total === "number" &&
      Array.isArray(response.data) &&
      response.data.every(isImageResponse)
    );
  }
  return false;
};

export interface ImageResponse {
  uri: string;
  data: Image;
}
export const isImageResponse = (
  possiblyResponse: unknown
): possiblyResponse is ImageResponse => {
  if (possiblyResponse !== null && typeof possiblyResponse === "object") {
    const response = possiblyResponse as ImageResponse;
    return typeof response.uri === "string" && isImage(response.data);
  }
  return false;
};

export interface Image {
  // incomplete type definition - canonical definition at https://github.com/guardian/grid/blob/main/common-lib/src/main/scala/com/gu/mediaservice/model/Image.scala
  id: GridId;
  thumbnail?: Thumbnail;
}
export const isImage = (possiblyImage: unknown): possiblyImage is Image => {
  if (possiblyImage !== null && typeof possiblyImage === "object") {
    const image = possiblyImage as Image;
    return isGridId(image.id) && isThumbnail(image.thumbnail);
  }
  return false;
};

export interface Thumbnail {
  // incomplete type definition - canonical definition at https://github.com/guardian/grid/blob/main/common-lib/src/main/scala/com/gu/mediaservice/model/Asset.scala
  file: string;
  secureUrl?: string;
}
export const isThumbnail = (
  possiblyThumbnail: unknown
): possiblyThumbnail is Thumbnail => {
  if (possiblyThumbnail !== null && typeof possiblyThumbnail === "object") {
    const thumbnail = possiblyThumbnail as Thumbnail;
    return (
      typeof thumbnail.file === "string" &&
      typeof thumbnail.secureUrl === "string"
    );
  }
  return false;
};

export type GridId = string;
export const isGridId = (possiblyId: string): possiblyId is GridId =>
  !!possiblyId.match(/^[0-9a-f]{40}$/i);
