import { jwtVerify } from "jose";
import crypto from "crypto";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { AppSyncAuthorizerEvent } from "aws-lambda";

import {
  PanDomainAuthentication,
  guardianValidation,
} from "@guardian/pan-domain-node";
import { AWS_REGION } from "../../shared/awsRegion";
import {
  pandaPublicConfigFilename,
  pandaSettingsBucketName,
} from "../../shared/panDomainAuth";

const pandaPromise: Promise<PanDomainAuthentication> =
  PanDomainAuthentication.builder({
    cookieName: "gutoolsAuth-assym",
    region: AWS_REGION,
    bucket: pandaSettingsBucketName,
    keyFile: pandaPublicConfigFilename,
    validateUser: guardianValidation,
    credentialsProvider: standardAwsConfig.credentials,
  });

exports.handler = async ({ authorizationToken }: AppSyncAuthorizerEvent) => {
  const panda = await pandaPromise;

  async function verifyJwt(key: crypto.KeyObject) {
    return await jwtVerify(authorizationToken, key);
  }

  const maybeAuthedUserEmail = (
    await panda.decode(verifyJwt).catch(console.warn)
  )?.payload["userEmail"];

  if (maybeAuthedUserEmail) {
    return {
      isAuthorized: true,
      resolverContext: {
        userEmail: maybeAuthedUserEmail,
      },
    };
  } else {
    return {
      isAuthorized: false,
    };
  }
};
