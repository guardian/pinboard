import { jwtVerify } from "jose";
import { getPandaConfig } from "../../shared/panDomainAuth";
import crypto from "crypto";
import { standardAwsConfig } from "../../shared/awsIntegration";
import * as AWS from "aws-sdk";
import { AppSyncAuthorizerEvent } from "aws-lambda";

const S3 = new AWS.S3(standardAwsConfig);

exports.handler = async ({
  authorizationToken,
  requestContext,
}: AppSyncAuthorizerEvent) => {
  console.log(requestContext);

  const pandaConfig = await getPandaConfig<{ publicKey: string }>(S3);

  const publicKey = crypto.createPublicKey(
    `-----BEGIN PUBLIC KEY-----\n${pandaConfig.publicKey}\n-----END PUBLIC KEY-----`
  );

  const maybeAuthedUserEmail =
    authorizationToken &&
    (await jwtVerify(authorizationToken, publicKey)).payload["userEmail"];

  // TODO is this sufficient? (does this expire after 1h or 90d)
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
