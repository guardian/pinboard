import { handler } from "./src";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { createDbTunnel } from "../shared/database/local/tunnel";

(async () => {
  await createDbTunnel();
  const listItemsPayload = {
    identity: { resolverContext: { userEmail: "foo@bar.com" } },
    arguments: { pinboardId: "123" },
    info: {
      fieldName: "listItems",
    },
  } as AppSyncResolverEvent<unknown, unknown>;

  console.log(
    "Testing tunnel with 'listItems' Query...\n",
    JSON.stringify(await handler(listItemsPayload))
  );
})();
