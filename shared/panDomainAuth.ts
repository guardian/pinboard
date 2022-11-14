import iniparser from "iniparser";
import * as AWS from "aws-sdk";
import { Stage } from "./types/stage";

const STAGE = (process.env.STAGE as Stage) || "LOCAL";

export const pandaSettingsBucketName = "pan-domain-auth-settings";

const pandaConfigFilename =
  STAGE === "PROD"
    ? "gutools.co.uk.settings"
    : "code.dev-gutools.co.uk.settings";

export const pandaPublicConfigFilename = `${pandaConfigFilename}.public`;

const pandaConfigLocation = {
  Bucket: pandaSettingsBucketName,
  Key: pandaConfigFilename,
};

export const getPandaConfig = async <T>(s3: AWS.S3) => {
  const pandaConfigIni = (
    await s3.getObject(pandaConfigLocation).promise()
  ).Body?.toString();

  if (!pandaConfigIni) {
    throw Error(
      `could not read panda config ${JSON.stringify(pandaConfigLocation)}`
    );
  }

  return iniparser.parseString(pandaConfigIni) as T;
};
