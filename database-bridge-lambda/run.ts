import { handler } from "./src";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";
import prompts from "prompts";
import { DatabaseOperation } from "../shared/graphql/operations";
import { getYourEmail } from "../shared/local/yourEmail";

(async () => {
  const baseInput = {
    identity: { resolverContext: { userEmail: await getYourEmail() } },
  };

  const sampleInputs: Partial<Record<DatabaseOperation, unknown>> = {
    listItems: { pinboardId: "63206" },
    searchMentionableUsers: { prefix: "a" },
    claimItem: { itemId: "1667" },
    getGroupPinboardIds: {},
    getItemCounts: { pinboardIds: ["65183"] },
  };

  await createDatabaseTunnel();

  // noinspection InfiniteLoopJS
  while (
    // eslint-disable-next-line no-constant-condition
    true
  ) {
    const { inputPayload } = await prompts({
      type: "select",
      name: "inputPayload",
      message: "Operation?",
      choices: Object.entries(sampleInputs).map(([operation, sampleInput]) => ({
        title: operation,
        value: {
          ...baseInput,
          arguments: sampleInput,
          info: { fieldName: operation },
        } as AppSyncResolverEvent<unknown, unknown>,
      })),
    });

    console.log(JSON.stringify(await handler(inputPayload), null, 2));
  }
})();
