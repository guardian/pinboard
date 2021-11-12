import {
  PanDomainAuthentication,
  AuthenticationStatus,
  guardianValidation,
} from "@guardian/pan-domain-node";
import { AWS_REGION } from "./awsRegion";

const STAGE = process.env.STAGE || "LOCAL";

const pandaConfigFilenameLookup: { [stage: string]: string } = {
  PROD: "gutools.co.uk.settings",
  CODE: "code.dev-gutools.co.uk.settings",
  LOCAL: "local.dev-gutools.co.uk.settings",
} as const;

export const pandaSettingsBucketName = "pan-domain-auth-settings";

export const pandaConfigFilename =
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

const maybePandaFallback =
  STAGE === "CODE" &&
  new PanDomainAuthentication(
    pandaCookieName,
    AWS_REGION, // AWS region
    pandaSettingsBucketName, // Settings bucket
    `${pandaConfigFilenameLookup["LOCAL"]}.public`, // Settings file
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

    // TODO can this be DRYed?
    if (maybePandaFallback) {
      const { status, user } = await maybePandaFallback.verify(cookieHeader);

      if (status === AuthenticationStatus.AUTHORISED && user) {
        return user.email;
      }
    }
  }
};

export const getVerifiedUserEmailFromPandaCookieValue = async (
  pandaCookieValue: string | undefined
): Promise<void | string> =>
  getVerifiedUserEmailFromCookieHeader(
    `${pandaCookieName}=${pandaCookieValue}`
  );
