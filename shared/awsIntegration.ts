import { SSM } from "@aws-sdk/client-ssm";
import { fromIni, fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { AWS_REGION } from "./awsRegion";
import { APP } from "./constants";

const LOCAL_PROFILE = "workflow";

export const IS_RUNNING_LOCALLY = !process.env.LAMBDA_TASK_ROOT;

export const STAGE = process.env.STAGE || "CODE"; // locally we use CODE AppSync API

export const standardAwsConfig = {
  region: AWS_REGION,
  credentials: IS_RUNNING_LOCALLY
    ? fromIni({ profile: LOCAL_PROFILE })
    : fromNodeProviderChain(),
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
