import * as AWS from "aws-sdk"; // TODO ideally convert to use "@aws-sdk/client-appsync" (couldn't get credentials to work)

const AWS_REGION = "eu-west-1";

const PROFILE = "composer"; //TODO change to composer once infra is built properly there

const CREDENTIAL_PROVIDER = new AWS.CredentialProviderChain([
  () => new AWS.SharedIniFileCredentials({ profile: PROFILE }),
  ...AWS.CredentialProviderChain.defaultProviders
]);

const awsConfig = {
  region: AWS_REGION,
  credentialProvider: CREDENTIAL_PROVIDER
};

const ONE_HOUR_IN_SECONDS = 60 * 60;
const TWENTY_FIVE_HOURS_IN_SECONDS = 25 * ONE_HOUR_IN_SECONDS;


const APP = "pinboard"; // TODO consider creating a shared directory at the top level for constants like this
const STAGE = process.env.STAGE || "CODE"; // locally we use CODE AppSync API

const client = new AWS.AppSync(awsConfig)

const appSyncApiPromise = client.listGraphqlApis({
  maxResults: 25 // TODO consider implementing paging (for absolute future proofing)
}).promise().then(
  _ => _.graphqlApis?.find(api =>
    api.tags?.["Stage"]===STAGE
    && api.tags?.["App"]===APP
  )
)

export interface AppSyncConfig {
  graphqlEndpoint: string;
  realtimeEndpoint: string;
  apiKey: string;
}

async function findExistingOrCreateApiKeyForUser(apiId: string, userEmail: string, nextToken?: string): Promise<AWS.AppSync.ApiKey | undefined> {

  const result = await client.listApiKeys({
    apiId,
    maxResults: 25,
    nextToken
  }).promise();

  const maybeSuitableKey = result.apiKeys?.find(_ =>
    _.description === userEmail
    && (_.expires || 0) > ((Date.now() / 1000) + ONE_HOUR_IN_SECONDS) // last for at least another hour
  );

  if(maybeSuitableKey){
    console.log(`Re-using API key for ${userEmail}`); //TODO remove in future once we've seen this happen for real
    return maybeSuitableKey;
  }
  else if (result.nextToken){
    return await findExistingOrCreateApiKeyForUser(apiId, userEmail, result.nextToken);
  }
  else {
    return (
      await client.createApiKey({
        apiId,
        description: userEmail,
        expires: ( Date.now()/1000 ) + TWENTY_FIVE_HOURS_IN_SECONDS // minimum expiry is one day
      }).promise()
    ).apiKey;
  }
}

export async function generateAppSyncConfig(userEmail: string): Promise<AppSyncConfig> {

  const appSyncAPI = await appSyncApiPromise;
  if(!appSyncAPI?.apiId) {
    throw Error(`Could not find a ${APP} AppSync instance for ${STAGE}`);
  }

  console.log(appSyncAPI);

  const apiKeyPromise = findExistingOrCreateApiKeyForUser(appSyncAPI.apiId, userEmail);

  const apiKey = (await apiKeyPromise)?.id;
  const graphqlEndpoint = appSyncAPI.uris?.["GRAPHQL"]
  const realtimeEndpoint = appSyncAPI.uris?.["REALTIME"]

  if(!graphqlEndpoint || !realtimeEndpoint){
    throw Error("Could not resolve AppSync endpoints.")
  }
  if(!apiKey){
    throw Error("Could not retrieve/create an AppSync API Key.")
  }

  return { graphqlEndpoint, realtimeEndpoint, apiKey }
}


