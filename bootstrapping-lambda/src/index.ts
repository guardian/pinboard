import {createServer, proxy} from "aws-serverless-express"
import * as lambda from "aws-lambda";
import {default as express, Response} from "express";
import {loaderTemplate} from "./loaderTemplate";
import {generateAppSyncConfig} from "./appSyncLookup";
import {getVerifiedUser} from "./panDomainAuth";
import {userHasPermission} from "./permissionCheck";

const server = express();

//TODO lookup the hash of the main JS file here and use it as a variable
const mainJsFilename = "pinboard.main.HASH.js"

const setJavascriptContentType = (_: Response) =>
  _.header("Content-Type", "application/javascript");

const setCacheControlHeader = (_: Response, value: string) =>
  _.header("Cache-Control", value);

// generic error handler to catch errors in the various async functions
server.use((request, response, next) => {
  try {
    next()
  }
  catch (error) {
    console.error(error)
    response.send(
      `console.error('PINBOARD SERVER ERROR : ${error.toString()}');`
    );
  }
})

server.get("/pinboard.loader.js", async (request, response) => {

  setCacheControlHeader(response,
    // absolutely no caching, as this JS will contain config/secrets to pass to the main
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
  setJavascriptContentType(response);

  const maybeAuthedUser = await getVerifiedUser(request.header('Cookie'));

  if(!maybeAuthedUser) {
    const message = "pan-domain auth cookie missing, invalid or expired"
    console.warn(message)
    response.send(`console.error('${message}')`)
  }
  else if (await userHasPermission(maybeAuthedUser.email)){

    const appSyncConfig = await generateAppSyncConfig(maybeAuthedUser.email);

    response.send(
      loaderTemplate(appSyncConfig, mainJsFilename)
    );

  }
  else {
    response.send("console.log('You do not have permission to use PinBoard')")
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

if (process.env.AWS_LAMBDA_FUNCTION_NAME) {

  exports.handler = (
    event: lambda.APIGatewayProxyEvent,
    context: lambda.Context
  ) => proxy(createServer(server), event, context);

} else { // if local then don't wrap in serverless

  const PORT = 3030;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

}

