import {
  PanDomainAuthentication,
  AuthenticationStatus,
  guardianValidation,
} from "@guardian/pan-domain-node";
import iniparser from "iniparser";
import * as AWS from "aws-sdk";
import { AWS_REGION } from "./awsRegion";

const STAGE = process.env.STAGE || "LOCAL";

const pandaConfigFilenameLookup: { [stage: string]: string } = {
  PROD: "gutools.co.uk.settings",
  CODE: "code.dev-gutools.co.uk.settings",
  LOCAL: "local.dev-gutools.co.uk.settings",
} as const;

export const pandaSettingsBucketName = "pan-domain-auth-settings";

const pandaConfigFilename =
  pandaConfigFilenameLookup[STAGE] || pandaConfigFilenameLookup["LOCAL"];

export const pandaPublicConfigFilename = `${pandaConfigFilename}.public`;

export const pandaCookieName = "gutoolsAuth-assym";

const panda = new PanDomainAuthentication(
  pandaCookieName,
  AWS_REGION, // AWS region
  pandaSettingsBucketName, // Settings bucket
  pandaPublicConfigFilename, // Settings file
  guardianValidation
);

export const getVerifiedUserEmailFromCookieHeader = async (
  cookieHeader: string | undefined
): Promise<void | string> => {
  if (cookieHeader) {
    const { status, user } = await panda.verify(cookieHeader);

    if (status === AuthenticationStatus.AUTHORISED && user) {
      return user.email;
    }
  }
};

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
