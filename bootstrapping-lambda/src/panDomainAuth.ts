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

export const initPanda = async () =>
  PanDomainAuthentication.builder({
    cookieName: "gutoolsAuth-assym",
    region: AWS_REGION,
    bucket: pandaSettingsBucketName,
    keyFile: pandaPublicConfigFilename,
    validateUser: guardianValidation,
    credentialsProvider: standardAwsConfig.credentials,
  });

export const getVerifiedUserEmail = async (
  panda: PanDomainAuthentication,
  cookieHeader: string | undefined
): Promise<void | string> => {
  if (cookieHeader) {
    const result = await panda.verify(cookieHeader);

    if (result.success && result.user) {
      return result.user.email;
    }
  }
};
