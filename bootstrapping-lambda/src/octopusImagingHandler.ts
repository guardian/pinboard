import { S3 } from "@aws-sdk/client-s3";
import { generateAppSyncConfig } from "./generateAppSyncConfig";
import { generatePreSignedGridUploadUrl } from "shared/grid";
import { CreateItemInput } from "shared/graphql/graphql";
import { appSyncCreateItem } from "./appSyncRequest";
import {
  IMAGING_COMPLETED_ITEM_TYPE,
  IMAGING_PICKED_UP_ITEM_TYPE,
} from "shared/octopusImaging";

interface CommonArgs {
  /* the email of the user who did the imaging work */
  userEmail: string; //TODO probably receive the desktop auth token instead (to verify on pinboard side)
  /* the id of the pinboard itself */
  workflowId: string;
  /* the itemId of the original request item in pinboard */
  pinboardItemId: string;
}

type ImagingOrderPickedUp = CommonArgs;
interface GeneratePreSignedGridUploadUrl extends CommonArgs {
  originalGridId: string;
  filename: string;
  /* SHA1 hash of the file content */
  newGridId: string;
  /* e.g. cutout, composite, etc */
  requestType: string;
}
interface ImagingOrderCompleted extends CommonArgs {
  /* SHA1 hash of the file content */
  newGridId: string;
}

export type ImagingCallFromOctopus =
  | ImagingOrderPickedUp
  | GeneratePreSignedGridUploadUrl
  | ImagingOrderCompleted;

export const isImagingCallFromOctopus = (
  detail: any
): detail is ImagingCallFromOctopus => !!detail && "pinboardItemId" in detail;

export const handleImagingCallFromOctopus = async (
  s3: S3,
  detail: ImagingCallFromOctopus
): Promise<string | void> => {
  console.log("Handling imaging call from Octopus", detail);
  if ("originalGridId" in detail) {
    return await generatePreSignedGridUploadUrl(detail);
  }
  const appSyncConfig = await generateAppSyncConfig(detail.userEmail, s3);
  const appSyncCreateItemInput: CreateItemInput = {
    pinboardId: detail.workflowId,
    relatedItemId: detail.pinboardItemId,
    claimable: false,
    mentions: null, //TODO consider @ing the original requester for these updates
    message: null,
    groupMentions: null,
    ...("newGridId" in detail
      ? {
          type: IMAGING_COMPLETED_ITEM_TYPE,
          payload: null, //TODO make use of the newGridId (perform lookup to grid)
        }
      : {
          type: IMAGING_PICKED_UP_ITEM_TYPE,
          payload: null,
        }),
  };
  return appSyncCreateItem(appSyncConfig, appSyncCreateItemInput).then(
    async (response) => {
      console.log(await response.text());
      if (!response.ok) {
        throw new Error(
          `Failed to create item: ${response.status} ${response.statusText}`
        );
      }
    }
  );
};
