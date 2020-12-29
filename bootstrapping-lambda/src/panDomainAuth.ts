import {
  PanDomainAuthentication,
  AuthenticationStatus,
  guardianValidation,
} from "@guardian/pan-domain-node";
import { AWS_REGION } from "../../shared/awsRegion";
import { User } from "../../shared/User";

const pandaKeyFilename = (function () {
  // TODO consider doing this via Stage tag OR injecting this value directly as env variable
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (functionName?.includes("PROD")) {
    return "gutools.co.uk.settings.public";
  } else if (functionName?.includes("CODE")) {
    return "code.dev-gutools.co.uk.settings.public";
  }
  return "local.dev-gutools.co.uk.settings.public";
})();

const panda = new PanDomainAuthentication(
  "gutoolsAuth-assym", // cookie name
  AWS_REGION, // AWS region
  "pan-domain-auth-settings", // Settings bucket
  pandaKeyFilename, // Settings file
  guardianValidation
);

export const getVerifiedUser = async (
  cookieHeader: string | undefined
): Promise<void | User> => {
  if (cookieHeader) {
    const { status, user } = await panda.verify(cookieHeader);

    if (status === AuthenticationStatus.AUTHORISED && user) {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      };
    }
  }
};
