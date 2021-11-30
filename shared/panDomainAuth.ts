import iniparser from "iniparser";
import * as AWS from "aws-sdk";

type Stage = "PROD" | "CODE" | "LOCAL";

const STAGE = (process.env.STAGE as Stage) || "LOCAL";

const pandaConfigFilenameLookup: { [stage in Stage]: string } = {
  PROD: "gutools.co.uk.settings",
  CODE: "code.dev-gutools.co.uk.settings",
  LOCAL: "local.dev-gutools.co.uk.settings",
} as const;

export const pandaSettingsBucketName = "pan-domain-auth-settings";

export const pandaPublicConfigFilename = `${
  pandaConfigFilenameLookup[STAGE] || pandaConfigFilenameLookup["LOCAL"]
}.public`;

export const pandaCookieName = "gutoolsAuth-assym";

const pandaConfigLocation = {
  Bucket: pandaSettingsBucketName,
  Key:
    STAGE === "PROD"
      ? pandaConfigFilenameLookup["PROD"]
      : pandaConfigFilenameLookup["CODE"],
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
