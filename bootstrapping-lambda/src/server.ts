import serverlessExpress from "@codegenie/serverless-express";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";

import { initPanda } from "./panDomainAuth";
import { initApp } from "./app";

type ServerlessExpressHandler = Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
>;

let serverlessExpressInstancePromise:
  | Promise<ServerlessExpressHandler>
  | undefined;

const getServerlessExpressInstance = () => {
  if (!serverlessExpressInstancePromise) {
    serverlessExpressInstancePromise = initPanda()
      .then((panda) =>
        serverlessExpress<APIGatewayProxyEvent, APIGatewayProxyResult>({
          app: initApp(panda),
          resolutionMode: "PROMISE", // this is the default mode, but worth being explicit because we're relying on it.
        })
      )
      .catch((error) => {
        console.error("Failed to initialise bootstrapping-lambda app", error);
        // clear the cached failure so the next invocation retries, rather than this execution environment failing forever
        serverlessExpressInstancePromise = undefined;
        throw error;
      });
  }
  return serverlessExpressInstancePromise;
};

// Start initialising during the Lambda init phase (i.e. at module load) to reduce latency on the first request.
// Errors are logged above and initialisation is retried by the handler, so swallow here to avoid an unhandled rejection.
getServerlessExpressInstance().catch(() => undefined);

const unsupportedCallback = () => {
  throw new Error(
    "bootstrapping-lambda handler is Promise-based; serverless-express must use resolutionMode 'PROMISE'"
  );
};

// This handler must stay Promise-based (async, no Lambda callback): a callback-style handler waits for the
// event loop to empty by default (callbackWaitsForEmptyEventLoop), which never happens because the panda
// client runs a setInterval to refresh its public key, so every invocation would time out.
export const handler: APIGatewayProxyHandler = async (event, context) => {
  const serverlessExpressInstance = await getServerlessExpressInstance();
  // serverless-express is set to resolutionMode "PROMISE", so this always returns a Promise
  return serverlessExpressInstance(
    event,
    context,
    unsupportedCallback
  ) as Promise<APIGatewayProxyResult>;
};
