import * as AWS from "aws-sdk";

const AWS_REGION = "eu-west-1";

const PROFILE = "workflow";

export const STAGE = process.env.STAGE || "CODE"; // locally we use CODE AppSync API

const CREDENTIAL_PROVIDER = new AWS.CredentialProviderChain([
  () => new AWS.SharedIniFileCredentials({ profile: PROFILE }),
  ...AWS.CredentialProviderChain.defaultProviders
]);

export const standardAwsConfig = {
  region: AWS_REGION,
  credentialProvider: CREDENTIAL_PROVIDER
};