import * as AWS from "aws-sdk";
import { AWS_REGION } from "./awsRegion";
import { APP } from "./constants";

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

const ssm = new AWS.SSM(standardAwsConfig);

const paramStorePromiseGetter =
  (WithDecryption: boolean) => (nameSuffix: string) => {
    const Name = `/${APP}/${nameSuffix}`;
    return ssm
      .getParameter({
        Name,
        WithDecryption,
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

export const pinboardSecretPromiseGetter = paramStorePromiseGetter(true);
export const pinboardConfigPromiseGetter = paramStorePromiseGetter(false);
