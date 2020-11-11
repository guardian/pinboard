import * as AWS from "aws-sdk"; // TODO ideally convert to use "@aws-sdk/client-appsync" (couldn't get credentials to work)

const AWS_REGION = "eu-west-1";

const PROFILE = "developerPlayground"; //TODO change to composer once infra is built properly there

const CREDENTIAL_PROVIDER = new AWS.CredentialProviderChain([
  () => new AWS.SharedIniFileCredentials({ profile: PROFILE }),
  ...AWS.CredentialProviderChain.defaultProviders
]);

const awsConfig = {
  region: AWS_REGION,
  credentialProvider: CREDENTIAL_PROVIDER
};

const TWENTY_FIVE_HOURS_IN_SECONDS = 60 * 60 * 25;

const client = new AWS.AppSync(awsConfig)

const apiId = "6tdimy5iczc7fb4adlxymf537q"; //TODO lookup by App and Stage tags

export interface AppSyncConfig {
  graphqlEndpoint: string;
  realtimeEndpoint: string;
  apiKey: string;
}

export async function generateAppSyncConfig(userEmail: string): Promise<AppSyncConfig> {

  const graphqlApiPromise = client.getGraphqlApi({
    apiId
  }).promise();
  // TODO probably look-up existing api-keys for that user before creating a new one (that are still valid for at least an hour)
  const apiKeyPromise = client.createApiKey({
    apiId,
    description: userEmail,
    expires: ( Date.now()/1000 ) + TWENTY_FIVE_HOURS_IN_SECONDS // minimum expiry is one day
  }).promise();

  const uris = (await graphqlApiPromise).graphqlApi?.uris;
  const apiKey = (await apiKeyPromise).apiKey?.id;
  const graphqlEndpoint = uris?.["GRAPHQL"]
  const realtimeEndpoint = uris?.["REALTIME"]

  if(!graphqlEndpoint || !realtimeEndpoint){
    throw Error("Could not resolve AppSync endpoints.")
  }
  if(!apiKey){
    throw Error("Could not create an AppSync API Key.")
  }

  return { graphqlEndpoint, realtimeEndpoint, apiKey }
}


