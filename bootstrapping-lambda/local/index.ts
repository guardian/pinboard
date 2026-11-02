import { AppSync } from "@aws-sdk/client-appsync";
import {
  pinboardConfigPromiseGetter,
  STAGE,
  standardAwsConfig,
} from "../../shared/awsIntegration";
import { APP } from "../../shared/constants";
import { ENVIRONMENT_VARIABLE_KEYS } from "../../shared/environmentVariables";
import { initApp } from "../src/app";
import { initPanda } from "../src/panDomainAuth";

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

    initPanda().then((panda) => {
      const PORT = 3030;
      initApp(panda).listen(PORT, () =>
        console.log(`Listening on port ${PORT}`)
      );
    });
  });
