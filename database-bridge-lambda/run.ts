import { handler } from "./src";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { createDbTunnel } from "../shared/database/local/tunnel";

(async () => {
  await createDbTunnel();
  console.log(
    "Testing tunnel with 'listItems' Query...\n",
    await handler({
      identity: { resolverContext: { userEmail: "foo@bar.com" } },
      arguments: { pinboardId: "123" },
      info: {
        fieldName: "listItems",
      },
    } as AppSyncResolverEvent<unknown, unknown>)
  );
})();
