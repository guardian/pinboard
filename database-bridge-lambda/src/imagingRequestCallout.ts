import fetch from "node-fetch";
import { getEnvironmentVariableOrThrow } from "shared/environmentVariables";
import { ItemWithParsedPayload } from "shared/types/ItemWithParsedPayload";

export const performImagingRequest = async (item: ItemWithParsedPayload) => {
  const gridId = (item.payload?.embeddableUrl as string)?.split("/").pop();
  if (!gridId) {
    throw new Error(`Couldn't extract grid ID from payload: ${item.payload}`);
  }
  const imagingRequestBody = {
    workflowId: item.pinboardId,
    pinboardItemId: item.id,
    lastUser: item.userEmail,
    notes: item.message, //TODO check for 256 max (probably limit in UI too)
    requestType: item.payload?.requestType, // TODO tighten this up
    gridId,
    // composerId: TODO lookup somehow
    // pubDate TODO scheduled launch vs some date field in workflow - what's worse wrong date or no date?
    // section TODO lookup somehow
    // story group name TODO (synced from InCopy most likely, if available)
  };
  console.log("Performing imaging request", imagingRequestBody);

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // self-signed cert on imaging server, which fails SSL check, so ignore
  const response = await fetch(
    `https://${getEnvironmentVariableOrThrow(
      "octopusImagingApiVpcEndpoint"
    )}/v1/rgbimageorder`,
    {
      // note this travels via vpc endpoint, via VPN to specific machine(s) on office network, no need to auth at this point
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imagingRequestBody),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Imaging request failed: ${response.status} ${response.statusText}`
    );
  }
};
