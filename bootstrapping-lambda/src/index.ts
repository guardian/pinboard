import {createServer, proxy} from "aws-serverless-express"
import * as lambda from "aws-lambda";
import {default as express, Response} from "express";
import {loaderTemplate} from "./loaderTemplate";
import {generateAppSyncConfig} from "./appSyncLookup";

const server = express();

//TODO lookup the hash of the main JS file here and use it as a variable
const mainJsFilename = "pinboard.main.HASH.js"

const setJavascriptContentType = (_: Response) =>
  _.header("Content-Type", "application/javascript");

const setCacheControlHeader = (_: Response, value: string) =>
  _.header("Cache-Control", value);

server.get("/pinboard.loader.js", async (request, response) => {

  setCacheControlHeader(response,
    // absolutely no caching, as this JS will contain config/secrets to pass to the main
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
  setJavascriptContentType(response);

  const userEmail = "user.email@guardian.co.uk" //TODO get using pan domain auth lib

  try {
    const appSyncConfig = await generateAppSyncConfig(userEmail);

    response.send(
      loaderTemplate(appSyncConfig, mainJsFilename)
    );
  } catch (error) {
    console.error(error)
    response.send(
      `console.error('Could not load AppSync connection information.');`
    )
  }

});

server.get(`/${mainJsFilename}`, (request, response) => {
  setCacheControlHeader(response,
    // this asset is static (as it's hashed) so it can be aggressively cached
    "public, max-age=604800, immutable"
  );
  setJavascriptContentType(response);
  response.send(`
    function Hello(name) {
      alert('Hello ' + name);
    }
  `) // TODO load file from S3?
});

// If local then don't wrap in serverless
if (process.env.NODE_ENV === 'local') {
  const PORT = 3030;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
} else {
  exports.handler = (
    event: lambda.APIGatewayProxyEvent,
    context: lambda.Context
  ) => proxy(createServer(server), event, context);
}

