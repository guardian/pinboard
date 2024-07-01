import { getEnvironmentVariableOrThrow } from "shared/environmentVariables";
import { ItemWithParsedPayload } from "shared/types/ItemWithParsedPayload";
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import { standardAwsConfig } from "shared/awsIntegration";

const lambda = new LambdaClient(standardAwsConfig);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

  const octopusLambdaFunctionName = getEnvironmentVariableOrThrow(
    "octopusApiLambdaFunctionName"
  );

  const octopusResponse = await lambda.send(
    new InvokeCommand({
      FunctionName: octopusLambdaFunctionName,
      Payload: textEncoder.encode(JSON.stringify(imagingRequestBody)),
      LogType: LogType.None, //TODO consider whether we tail the octopus logs as pinboard logs
    })
  );

  if (octopusResponse.FunctionError) {
    console.error(octopusResponse.FunctionError);
    throw Error(octopusResponse.FunctionError);
  } else {
    console.log(
      "Imaging request complete",
      JSON.parse(textDecoder.decode(octopusResponse.Payload))
    );

    // FIXME return something from octopusResponse.Payload
  }
};
