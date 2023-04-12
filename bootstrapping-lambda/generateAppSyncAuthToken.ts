import prompts from "prompts";
import { S3 } from "@aws-sdk/client-s3";
import { standardAwsConfig } from "../shared/awsIntegration";
import { getYourEmail } from "../shared/local/yourEmail";

(async () => {
  const s3 = new S3(standardAwsConfig);

  const { stage } = await prompts({
    type: "select",
    name: "stage",
    message: "Stage?",
    choices: [
      { title: "CODE", value: "CODE", selected: true },
      { title: "PROD", value: "PROD" },
    ],
  });

  process.env.STAGE = stage;
  process.env.GRAPHQL_ENDPOINT = "N/A";

  const yourEmail = await getYourEmail();

  // using dynamic import to allow us to override STAGE which is evaluated when the module is imported
  const generateAppSyncConfig = (await import("./src/generateAppSyncConfig"))
    .generateAppSyncConfig;

  console.log((await generateAppSyncConfig(yourEmail, s3)).authToken);
})();
