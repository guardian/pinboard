import { createServer, proxy } from "aws-serverless-express";
import * as lambda from "aws-lambda";
import { default as express } from "express";
import cors from "cors";
import { loaderTemplate } from "./loaderTemplate";
import { generateAppSyncConfig } from "./generateAppSyncConfig";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { userHasPermission } from "./permissionCheck";
import * as AWS from "aws-sdk";
import fs from "fs";
import {
  applyAggressiveCaching,
  applyNoCaching,
  applyJavascriptContentType,
} from "./util";
import { GIT_COMMIT_HASH } from "../../GIT_COMMIT_HASH";
import { getVerifiedUserEmail } from "./panDomainAuth";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { Stage } from "../../shared/types/stage";
import { GrafanaRequest } from "../../shared/types/grafanaType";
import {
  AuthenticatedRequest,
  authMiddleware,
} from "./middleware/auth-middleware";

import { getMetrics } from "./reporting/reportingServiceClient";

const IS_RUNNING_LOCALLY = !process.env.LAMBDA_TASK_ROOT;

const S3 = new AWS.S3(standardAwsConfig);

const server = express();

const allowList = [
  "https://grafana.local.dev-gutools.co.uk",
  "https://metrics.gutools.co.uk",
];

const corsOptions: cors.CorsOptions = {
  origin: allowList,
  credentials: true,
};

server.use(express.json());
server.use(cors(corsOptions));

server.post(
  "/query",
  authMiddleware,
  async (request: AuthenticatedRequest, response) => {
    const { userEmail } = request;
    if (!userEmail) return response.status(401).send("Unauthorized");
    const { body: metricsQuery }: { body: GrafanaRequest } = request;

    const metrics = await getMetrics(metricsQuery);

    console.log("METRICS", metrics);

    response.json(metrics);
  }
);

server.get("/_prout", (_, response) => response.send(GIT_COMMIT_HASH));

server.post("/search", authMiddleware, (_, response) =>
  response.json(["uniqueUsers"])
);

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

server.get("/pinboard.loader.js", async (request, response) => {
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
      const lastModified = fs.statSync(`${clientDirectory}/${filename}`).mtime;
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

  const maybeCookieHeader = request.header("Cookie");

  const maybeAuthedUserEmail = await getVerifiedUserEmail(maybeCookieHeader);

  if (!maybeAuthedUserEmail) {
    const message = "pan-domain auth cookie missing, invalid or expired";
    console.warn(message);
    response.send(`console.error('${message}')`);
  } else if (await userHasPermission(maybeAuthedUserEmail)) {
    const appSyncConfig = await generateAppSyncConfig(maybeAuthedUserEmail, S3);

    response.send(
      loaderTemplate(
        {
          sentryDSN: getEnvironmentVariableOrThrow("sentryDSN"),
          appSyncConfig,
          userEmail: maybeAuthedUserEmail,
          stage: (process.env.STAGE as Stage) || "LOCAL",
        },
        mainJsFilename,
        request.hostname
      )
    );
  } else {
    response.send("console.log('You do not have permission to use PinBoard')");
  }
});

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
