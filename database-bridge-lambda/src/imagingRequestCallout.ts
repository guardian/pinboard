import {
  pinboardConfigPromiseGetter,
  pinboardSecretPromiseGetter,
  STAGE,
} from "shared/awsIntegration";
import fetch from "node-fetch";
import { ItemWithParsedPayload } from "client/src/types/ItemWithParsedPayload";

const paramStorePrefix = `octopus-imaging/${STAGE}`;
const octopusImagingBaseUrl = pinboardConfigPromiseGetter(
  `${paramStorePrefix}/base-url`
);
const octopusImagingApiKey = pinboardSecretPromiseGetter(
  `${paramStorePrefix}/api-key`
);
const octopusImagingApiSecret = pinboardSecretPromiseGetter(
  `${paramStorePrefix}/api-secret`
);

export const performImagingRequest = async (
  item: ItemWithParsedPayload,
  { embeddableUrl, requestType }: Record<string, unknown>
): Promise<string> => {
  const gridId = (embeddableUrl as string).split("/").pop();
  if (!gridId) {
    throw new Error(`Couldn't extract grid ID from payload: ${item.payload}`);
  }
  const imagingRequestBody = {
    workflowId: item.pinboardId,
    pinboardItemId: item.id,
    gridId,
    lastUser: item.userEmail,
    notes: item.message, //TODO check for 256 max (probably limit in UI too)
    requestType,
    sectionId: 0, // FIXME this shouldn't be a requirement of the API surely
  };
  console.log("Performing imaging request", imagingRequestBody);

  const response = await fetch(await octopusImagingBaseUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": await octopusImagingApiKey,
      "x-api-secret": await octopusImagingApiSecret,
    },
    body: JSON.stringify(imagingRequestBody),
  });

  if (!response.ok) {
    const errorMessage = `Octopus Imaging request failed: ${response.status} ${response.statusText}`;
    console.error(errorMessage, await response.text());
    throw Error(errorMessage);
  }

  const body = await response.json();

  console.log("Imaging request successful", body);

  return body.id;
};
