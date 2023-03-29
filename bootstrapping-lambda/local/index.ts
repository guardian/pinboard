import { AppSync } from "@aws-sdk/client-appsync";
import {
  pinboardConfigPromiseGetter,
  STAGE,
  standardAwsConfig,
} from "../../shared/awsIntegration";
import { APP } from "../../shared/constants";
import { ENVIRONMENT_VARIABLE_KEYS } from "../../shared/environmentVariables";

pinboardConfigPromiseGetter("sentryDSN").then(
  (sentryDSN) => (process.env[ENVIRONMENT_VARIABLE_KEYS.sentryDSN] = sentryDSN)
);

new AppSync(standardAwsConfig)
  .listGraphqlApis({
    maxResults: 25, // TODO consider implementing paging (for absolute future proofing)
  })
  .then((_) =>
    _.graphqlApis?.find(
      (api) => api.tags?.["Stage"] === STAGE && api.tags?.["App"] === APP
    )
  )
  .then((appSyncAPI) => {
    if (!appSyncAPI) {
      throw Error("could not find AppSync API");
    }
    process.env[ENVIRONMENT_VARIABLE_KEYS.graphqlEndpoint] =
      appSyncAPI.uris?.["GRAPHQL"];

    import("../src/server"); // actually start the server, once the environment variable is set
  });
