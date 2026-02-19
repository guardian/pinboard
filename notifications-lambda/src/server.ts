import { default as express } from "express";
import { IS_RUNNING_LOCALLY } from "shared/awsIntegration";
import { getVerifiedUserEmail } from "shared/server/panDomainAuth";

export const server = express();

// TODO: Move notifications endpoint from bootstrapping-lambda here
//
// server.get("", async (request, response) => {
//   const maybeCookie = request.header("Cookie");
//   const maybeAuthenticatedEmail = await getVerifiedUserEmail(maybeCookie);
//   response.send(`Hello, ${maybeAuthenticatedEmail || "Guest"}!`);
// });

const authMiddleware = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  const maybeCookie = request.header("Cookie");
  const maybeAuthenticatedEmail = await getVerifiedUserEmail(maybeCookie);
  if (!maybeAuthenticatedEmail) {
    response.status(401).send("Unauthorized"); // TODO replace with redirect to login tool
    return;
  }
  next();
};

const clientDirectory = IS_RUNNING_LOCALLY
  ? `${__dirname}/../notifications-ui/dist`
  : `${process.env.LAMBDA_TASK_ROOT}/client`; // TODO change bundling to include built svelte UI in the client directory

// TODO think about caching
server.use(authMiddleware, express.static(clientDirectory)); // this allows us to serve the static client files (inc. the source map)

if (IS_RUNNING_LOCALLY) {
  // if local then don't wrap in serverless

  const PORT = 3031;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}
