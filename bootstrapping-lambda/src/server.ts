import { createServer, proxy } from "aws-serverless-express";
import * as lambda from "aws-lambda";
import { default as express } from "express";
import { loaderTemplate } from "./loaderTemplate";
import { generateAppSyncConfig } from "./appSyncLookup";
import { getVerifiedUserEmail } from "./panDomainAuth";
import { userHasPermission } from "./permissionCheck";
import fs from "fs";
import {
  applyAggressiveCaching,
  applyNoCaching,
  applyJavascriptContentType,
} from "./util";
import { GIT_COMMIT_HASH } from "../../GIT_COMMIT_HASH";

const IS_RUNNING_LOCALLY = !process.env.LAMBDA_TASK_ROOT;

const server = express();

server.get("/_prout", (_, response) => response.send(GIT_COMMIT_HASH));

// generic error handler to catch errors in the various async functions
server.use((request, response, next) => {
  try {
    next();
  } catch (error) {
    console.error(error);
    response.send(
      `console.error('PINBOARD SERVER ERROR : ${error.toString()}');`
    );
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

  const maybeAuthedUserEmail = await getVerifiedUserEmail(
    request.header("Cookie")
  );

  if (!maybeAuthedUserEmail) {
    const message = "pan-domain auth cookie missing, invalid or expired";
    console.warn(message);
    response.send(`console.error('${message}')`);
  } else if (await userHasPermission(maybeAuthedUserEmail)) {
    const appSyncConfig = await generateAppSyncConfig(maybeAuthedUserEmail);

    response.send(
      loaderTemplate(appSyncConfig, mainJsFilename, request.hostname)
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
