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
