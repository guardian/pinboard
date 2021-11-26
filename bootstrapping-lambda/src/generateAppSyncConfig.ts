import * as AWS from "aws-sdk";
import crypto from "crypto";
import { SignJWT } from "jose";
import { STAGE, standardAwsConfig } from "../../shared/awsIntegration";
import { AppSyncConfig } from "../../shared/appSyncConfig";
import { getPandaConfig } from "../../shared/panDomainAuth";

const APP = "pinboard"; // TODO consider creating a shared directory at the top level for constants like this

const client = new AWS.AppSync(standardAwsConfig);

const appSyncApiPromise = client
  .listGraphqlApis({
    maxResults: 25, // TODO consider implementing paging (for absolute future proofing)
  })
  .promise()
  .then((_) =>
    _.graphqlApis?.find(
      (api) => api.tags?.["Stage"] === STAGE && api.tags?.["App"] === APP
    )
  );

export async function generateAppSyncConfig(
  userEmail: string,
  s3: AWS.S3
): Promise<AppSyncConfig> {
  const appSyncAPI = await appSyncApiPromise;
  if (!appSyncAPI?.apiId) {
    throw Error(`Could not find a ${APP} AppSync instance for ${STAGE}`);
  }

  const pandaConfig = await getPandaConfig<{ privateKey: string }>(s3);

  const privateKey = crypto.createPrivateKey(
    `-----BEGIN RSA PRIVATE KEY-----\n${pandaConfig.privateKey}\n-----END RSA PRIVATE KEY-----`
  );

  const authToken = await new SignJWT({ userEmail })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setIssuer(APP)
    .setProtectedHeader(({ alg: "RS256" } as unknown) as any)
    .sign(privateKey);

  const graphqlEndpoint = appSyncAPI.uris?.["GRAPHQL"];
  const realtimeEndpoint = appSyncAPI.uris?.["REALTIME"];

  if (!graphqlEndpoint || !realtimeEndpoint) {
    throw Error("Could not resolve AppSync endpoints.");
  }
  if (!authToken) {
    throw Error("Could not retrieve/create an authentication token.");
  }

  return { graphqlEndpoint, realtimeEndpoint, authToken };
}
