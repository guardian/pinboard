import prompts from "prompts";
import { handleImagingCallFromOctopus } from "../src/octopusImagingHandler";
import { S3 } from "@aws-sdk/client-s3";
import { standardAwsConfig } from "shared/awsIntegration";
import { IMAGINE_REQUEST_TYPES } from "shared/octopusImaging";
import { getYourEmail } from "shared/local/yourEmail";
import { initEnvVars } from "./initLocalEnvVars";

initEnvVars().then(async () => {
  const s3 = new S3(standardAwsConfig);

  const newGridId = "TBC"; //TODO get media id of modified image

  // noinspection InfiniteLoopJS
  while (
    // eslint-disable-next-line no-constant-condition
    true
  ) {
    const { args } = await prompts(
      {
        type: "select",
        name: "args",
        message: "Operation?",
        choices: [
          {
            title: "ImagingOrderPickedUp",
            value: {},
          },
          {
            title: "GeneratePreSignedGridUploadUrl",
            value: {
              originalGridId: "223636f8d305a77e60fb2aa4525effbd66a7560d",
              filename: "Historic_yachts_22.JPG",
              newGridId,
              requestType: IMAGINE_REQUEST_TYPES[0],
            },
          },
          {
            title: "ImagingOrderCompleted",
            value: {
              newGridId,
            },
          },
        ],
      },
      { onCancel: () => process.exit() }
    );

    console.log(
      (await handleImagingCallFromOctopus(s3, {
        userEmail: await getYourEmail(),
        workflowId: "65518",
        pinboardItemId: "3458",
        ...args,
      })) || "DONE"
    );
  }
});
