import { handler } from "./src";
import { ENVIRONMENT_VARIABLE_KEYS } from "../shared/environmentVariables";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import {
  establishTunnelToDBProxy,
  isThereExistingTunnel,
} from "./local/establishTunnel";
import { getJumpHost } from "./local/getJumpHost";
import { DATABASE_PORT, getDatabaseProxyName } from "../shared/database";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../shared/awsIntegration";

(async () => {
  const stage = "CODE"; //TODO prompt for stage (so we can do PROD)

  const DBProxyName = getDatabaseProxyName(stage);

  const dbProxyResponse = await new AWS.RDS(standardAwsConfig)
    .describeDBProxies({ DBProxyName })
    .promise();

  const { Endpoint } = dbProxyResponse.DBProxies![0]!;
  process.env[ENVIRONMENT_VARIABLE_KEYS.databaseHostname] = Endpoint!;
  console.log(`DB Proxy Hostname: ${Endpoint!}`);

  if (await isThereExistingTunnel(Endpoint!)) {
    console.log(
      `It looks like there is already a suitable SSH tunnel established on localhost:${DATABASE_PORT} 🎉`
    );
  } else {
    const jumpHostInstanceId = await getJumpHost(stage);

    await establishTunnelToDBProxy(stage, jumpHostInstanceId, Endpoint!);
  }

  const listItemsPayload = {
    identity: { resolverContext: { userEmail: "foo@bar.com" } },
    arguments: { pinboardId: "123" },
    info: {
      fieldName: "listItems",
    },
  } as AppSyncResolverEvent<unknown, unknown>;

  console.log(JSON.stringify(await handler(listItemsPayload)));
})();
