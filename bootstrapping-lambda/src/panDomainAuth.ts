import {
  PanDomainAuthentication,
  guardianValidation,
} from "@guardian/pan-domain-node";
import { AWS_REGION } from "../../shared/awsRegion";
import { standardAwsConfig } from "shared/awsIntegration";
import {
  pandaPublicConfigFilename,
  pandaSettingsBucketName,
} from "../../shared/panDomainAuth";

const panda = new PanDomainAuthentication(
  "gutoolsAuth-assym", // cookie name
  AWS_REGION, // AWS region
  pandaSettingsBucketName, // Settings bucket
  pandaPublicConfigFilename, // Settings files
  guardianValidation,
  standardAwsConfig.credentials
);

export const getVerifiedUserEmail = async (
  cookieHeader: string | undefined
): Promise<void | string> => {
  if (cookieHeader) {
    const result = await panda.verify(cookieHeader);

    if (result.success && result.user) {
      return result.user.email;
    }
  }
};
