import { default as express } from "express";
import { IS_RUNNING_LOCALLY } from "shared/awsIntegration";

export const server = express();

// TODO: Add panda auth middleware to protect endpoints
// TODO: Move notifications endpoint from bootstrapping-lambda here

server.get("", (_, response) => {
  response.send("Notifications Lambda is running.");
});

if (IS_RUNNING_LOCALLY) {
  // if local then don't wrap in serverless

  const PORT = 3031;
  server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}
