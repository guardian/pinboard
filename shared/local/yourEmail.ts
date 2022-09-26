import { standardAwsConfig } from "../awsIntegration";
import AWS from "aws-sdk";

export const getYourEmail = async () => {
  const userName = (
    await new AWS.STS(standardAwsConfig).getCallerIdentity().promise()
  ).UserId?.split(":")[1];

  return `${userName}@guardian.co.uk`;
};
