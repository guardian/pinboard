import { standardAwsConfig } from "../awsIntegration";
import { STS } from "@aws-sdk/client-sts";

export const getYourEmail = async () => {
  const userName = (
    await new STS(standardAwsConfig).getCallerIdentity({})
  ).UserId?.split(":")[1];

  return `${userName}@guardian.co.uk`;
};
