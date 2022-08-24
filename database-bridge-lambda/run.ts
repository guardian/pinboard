import { handler } from "./src";
import { ENVIRONMENT_VARIABLE_KEYS } from "../shared/environmentVariables";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { establishTunnelToDBProxy } from "./local/establishTunnel";
import { getJumpHost } from "./local/getJumpHost";

(async () => {
  const stage = "CODE"; //TODO prompt for stage

  const jumpHostInstanceId = await getJumpHost(stage);

  process.env[ENVIRONMENT_VARIABLE_KEYS.databaseHostname] = "localhost";

  await establishTunnelToDBProxy(stage, jumpHostInstanceId);

  const payload = {
    identity: { resolverContext: { userEmail: "foo@bar.com" } },
    arguments: {
      pinboardId: "123",
    },
    info: {
      fieldName: "listItems",
    },
  } as AppSyncResolverEvent<unknown, unknown>;

  console.log(JSON.stringify(await handler(payload)));
})();
