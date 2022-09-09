import { handler } from "./src";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";

(async () => {
  await createDatabaseTunnel();
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
