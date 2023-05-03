import { handler } from "./src";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";
import prompts from "prompts";
import { DatabaseOperation } from "../shared/graphql/operations";
import { getYourEmail } from "../shared/local/yourEmail";
import { CreateItemInput, EditItemInput } from "../shared/graphql/graphql";

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
    createItem: {
      input: {
        type: "message-only",
        pinboardId: "63206",
        message: "DB testing",
      } as CreateItemInput,
    },
    editItem: {
      itemId: "2352",
      input: {
        message: "DB testing MODIFIED",
        payload: JSON.stringify({ blah: "payload added" }),
        type: "testing",
      } as EditItemInput,
    },
    deleteItem: { itemId: "2352" },
    getMyUser: {},
    addVisitedTourStep: { tourStepId: "testing" },
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
