import { SSM } from "@aws-sdk/client-ssm";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { AWS_REGION } from "./awsRegion";
import { APP } from "./constants";

const PROFILE = "workflow";

export const STAGE = process.env.STAGE || "CODE"; // locally we use CODE AppSync API

export const standardAwsConfig = {
  region: AWS_REGION,
  credentials: fromNodeProviderChain({ profile: PROFILE }),
};

const ssm = new SSM(standardAwsConfig);

const paramStorePromiseGetter =
  (WithDecryption: boolean) => (nameSuffix: string) => {
    const Name = `/${APP}/${nameSuffix}`;
    return ssm
      .getParameter({
        Name,
        WithDecryption,
      })
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
