import { default as express } from "express";
import { IS_RUNNING_LOCALLY } from "shared/awsIntegration";
import { getVerifiedUserEmail } from "shared/server/panDomainAuth";

export const server = express();

// TODO: Move notifications endpoint from bootstrapping-lambda here

server.get("", async (request, response) => {
  const maybeCookie = request.header("Cookie");
  const maybeAuthenticatedEmail = await getVerifiedUserEmail(maybeCookie);
  response.send(`Hello, ${maybeAuthenticatedEmail || "Guest"}!`);
});

if (IS_RUNNING_LOCALLY) {
  // if local then don't wrap in serverless

  const PORT = 3031;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}
