import {
  PanDomainAuthentication,
  AuthenticationStatus,
  guardianValidation,
} from "@guardian/pan-domain-node";
import { AWS_REGION } from "../../shared/awsRegion";
import {
  pandaPublicConfigFilename,
  pandaSettingsBucketName,
} from "../../shared/panda";

const panda = new PanDomainAuthentication(
  "gutoolsAuth-assym", // cookie name
  AWS_REGION, // AWS region
  pandaSettingsBucketName, // Settings bucket
  pandaPublicConfigFilename, // Settings file
  guardianValidation
);

export const getVerifiedUserEmail = async (
  cookieHeader: string | undefined
): Promise<void | string> => {
  if (cookieHeader) {
    const { status, user } = await panda.verify(cookieHeader);

    if (status === AuthenticationStatus.AUTHORISED && user) {
      return user.email;
    }
  }
};
