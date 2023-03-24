import { jwtVerify } from "jose";
import { getPandaConfig } from "../../shared/panDomainAuth";
import crypto from "crypto";
import { standardAwsConfig } from "../../shared/awsIntegration";
import * as AWS from "aws-sdk";
import { AppSyncAuthorizerEvent } from "aws-lambda";

const s3 = new AWS.S3(standardAwsConfig);

exports.handler = async ({ authorizationToken }: AppSyncAuthorizerEvent) => {
  const pandaConfig = await getPandaConfig<{ publicKey: string }>(s3);

  const publicKey = crypto.createPublicKey(
    `-----BEGIN PUBLIC KEY-----\n${pandaConfig.publicKey}\n-----END PUBLIC KEY-----`
  );

  const maybeAuthedUserEmail =
    authorizationToken &&
    (await jwtVerify(authorizationToken, publicKey).catch(console.warn))
      ?.payload["userEmail"];

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
