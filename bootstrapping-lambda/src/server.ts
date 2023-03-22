import { createServer, proxy } from "aws-serverless-express";
import * as lambda from "aws-lambda";
import { default as express } from "express";
import cors from "cors";
import { loaderTemplate } from "./loaderTemplate";
import { generateAppSyncConfig } from "./generateAppSyncConfig";
import { standardAwsConfig } from "../../shared/awsIntegration";
import * as AWS from "aws-sdk";
import fs from "fs";
import {
  applyAggressiveCaching,
  applyNoCaching,
  applyJavascriptContentType,
} from "./util";
import { GIT_COMMIT_HASH } from "../../GIT_COMMIT_HASH";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { Stage } from "../../shared/types/stage";
import { GrafanaRequest, StageMetric } from "../../shared/types/grafanaType";
import {
  AuthenticatedRequest,
  getAuthMiddleware,
} from "./middleware/auth-middleware";

import { getMetrics } from "./reporting/reportingServiceClient";

const IS_RUNNING_LOCALLY = !process.env.LAMBDA_TASK_ROOT;

const S3 = new AWS.S3(standardAwsConfig);

const server = express();

const allowList = [
  "https://grafana.local.dev-gutools.co.uk",
  "https://metrics.gutools.co.uk",
  "https://public.metrics.gutools.co.uk",
];

const corsOptions: cors.CorsOptions = {
  origin: allowList,
  credentials: true,
};

server.use(express.json());
server.use(cors(corsOptions));

server.post("/search", getAuthMiddleware(), (_, response) => {
  response.setHeader("Access-Control-Allow-Credentials", "true");
  return response.json(Object.values(StageMetric));
});

server.post(
  "/query",
  getAuthMiddleware(),
  async (request: AuthenticatedRequest, response) => {
    response.setHeader("Access-Control-Allow-Credentials", "true");
    const { body: metricsQuery }: { body: GrafanaRequest } = request;
    response.json(await getMetrics(metricsQuery));
  }
);

server.get("/_prout", (_, response) => response.send(GIT_COMMIT_HASH));

// generic error handler to catch errors in the various async functions
server.use((request, response, next) => {
  try {
    next();
  } catch (error) {
    console.error(error);
    const message =
      error && (error as Error)?.toString ? (error as Error).toString() : error;
    response.send(`console.error('PINBOARD SERVER ERROR : ${message}');`);
  }
});

if (IS_RUNNING_LOCALLY) {
  server.use(express.static("local"));
}

const clientDirectory = IS_RUNNING_LOCALLY
  ? `${__dirname}/../../client/dist`
  : `${process.env.LAMBDA_TASK_ROOT}/client`;

const MAIN_JS_FILENAME_PREFIX = "pinboard.main";
const JS_EXTENSION = ".js";

interface FileWithLastModified {
  filename: string;
  lastModified: Date;
}

server.get(
  "/pinboard.loader.js",
  getAuthMiddleware(true),
  async (request: AuthenticatedRequest, response) => {
    applyNoCaching(response); // absolutely no caching, as this JS will contain config/secrets to pass to the main

    applyJavascriptContentType(response);

    const mainJsFilename: string | undefined = fs
      .readdirSync(clientDirectory)
      .filter(
        (filename) =>
          filename.startsWith(MAIN_JS_FILENAME_PREFIX) &&
          filename.endsWith(JS_EXTENSION)
      )
      .reduce((mostRecentSoFar, filename) => {
        const lastModified = fs.statSync(
          `${clientDirectory}/${filename}`
        ).mtime;
        if (mostRecentSoFar && mostRecentSoFar.lastModified > lastModified) {
          return mostRecentSoFar;
        }
        return {
          filename,
          lastModified,
        };
      }, undefined as FileWithLastModified | undefined)?.filename;

    if (!mainJsFilename) {
      const message = "no hashed pinboard.main js file available";
      console.error(message);
      return response.send(`console.error('${message}')`);
    }

    const appSyncConfig = await generateAppSyncConfig(request.userEmail!, S3);

    response.send(
      loaderTemplate(
        {
          sentryDSN: getEnvironmentVariableOrThrow("sentryDSN"),
          appSyncConfig,
          userEmail: request.userEmail!,
          stage: (process.env.STAGE as Stage) || "LOCAL",
        },
        mainJsFilename,
        request.hostname
      )
    );
  }
);

server.get(
  `/${MAIN_JS_FILENAME_PREFIX}*${JS_EXTENSION}`,
  (request, response, next) => {
    // when running in watch mode, sometimes the filename hash doesn't get updated, so we don't want to cache locally
    IS_RUNNING_LOCALLY
      ? applyNoCaching(response)
      : applyAggressiveCaching(response);

    applyJavascriptContentType(response);

    next();
  }
);

server.use(express.static(clientDirectory)); // this allows us to serve the static client files (inc. the source map)

if (IS_RUNNING_LOCALLY) {
  // if local then don't wrap in serverless

  const PORT = 3030;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
} else {
  exports.handler = (
    event: lambda.APIGatewayProxyEvent,
    context: lambda.Context
  ) => proxy(createServer(server), event, context);
}
