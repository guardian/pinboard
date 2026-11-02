import serverlessExpress from "@codegenie/serverless-express";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Callback,
  Context,
} from "aws-lambda";

import { initPanda } from "./panDomainAuth";
import { initApp } from "./app";

let serverlessExpressInstance: APIGatewayProxyHandler | undefined;

async function setup(
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> {
  const panda = await initPanda();
  const app = initApp(panda);
  serverlessExpressInstance = serverlessExpress({
    app,
    resolutionMode: "PROMISE", // this is the default mode, but worth being explicit because we're relying on it.
  });
  // serverless-express is set to resolutionMode "PROMISE", so this always returns a Promise
  return serverlessExpressInstance(
    event,
    context,
    callback
  ) as Promise<APIGatewayProxyResult>;
}

const handler: APIGatewayProxyHandler = (event, context, callback) => {
  if (serverlessExpressInstance)
    return serverlessExpressInstance(event, context, callback);

  return setup(event, context, callback);
};

exports.handler = handler;
