import * as AWS from "aws-sdk";
import { AWS_REGION } from "./awsRegion";

const PROFILE = "workflow";

export const STAGE = process.env.STAGE || "CODE"; // locally we use CODE AppSync API

const CREDENTIAL_PROVIDER = new AWS.CredentialProviderChain([
  () => new AWS.SharedIniFileCredentials({ profile: PROFILE }),
  ...AWS.CredentialProviderChain.defaultProviders,
]);

export const standardAwsConfig = {
  region: AWS_REGION,
  credentialProvider: CREDENTIAL_PROVIDER,
};

const ssm = new AWS.SSM();

export const pinboardSecretPromiseGetter = (nameSuffix: string) => () => {
  const Name = `/${process.env.APP}/${nameSuffix}`;
  return ssm
    .getParameter({
      Name,
      WithDecryption: true,
    })
    .promise()
    .then((result) => {
      const value = result.Parameter?.Value;
      if (!value) {
        throw Error(`Could not retrieve parameter value for '${Name}'`);
      }
      return value;
    });
};
