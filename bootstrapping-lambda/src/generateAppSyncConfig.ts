import { S3 } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { SignJWT } from "jose";
import { AppSyncConfig } from "../../shared/appSyncConfig";
import { getPandaConfig } from "../../shared/panDomainAuth";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { APP } from "../../shared/constants";

export async function generateAppSyncConfig(
  userEmail: string,
  s3: S3
): Promise<AppSyncConfig> {
  const graphqlEndpoint = getEnvironmentVariableOrThrow("graphqlEndpoint");

  const pandaConfig = await getPandaConfig<{ privateKey: string }>(s3);

  const privateKey = crypto.createPrivateKey(
    `-----BEGIN RSA PRIVATE KEY-----\n${pandaConfig.privateKey}\n-----END RSA PRIVATE KEY-----`
  );

  const authToken = await new SignJWT({ userEmail })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setIssuer(APP)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);

  if (!authToken) {
    throw Error("Could not retrieve/create an authentication token.");
  }

  return { graphqlEndpoint, authToken };
}
