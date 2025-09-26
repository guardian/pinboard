import { handler } from "./src";
import { createDatabaseTunnel } from "shared/database/local/databaseTunnel";
import prompts from "prompts";
import { DatabaseOperation } from "shared/graphql/operations";
import { getYourEmail } from "shared/local/yourEmail";
import { CreateItemInput, EditItemInput } from "shared/graphql/graphql";
import { IMAGING_REQUEST_ITEM_TYPE } from "shared/octopusImaging";

(async () => {
  const baseInput = {
    identity: { resolverContext: { userEmail: await getYourEmail() } },
    request: { headers: { referrer: "LOCAL-TESTING" }, domainName: null },
  };

  const sampleInputs = {
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
    visitTourStep: { tourStepId: "testing" },
  } satisfies Partial<Record<DatabaseOperation, unknown>>;

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
      choices: [
        ...Object.entries(sampleInputs).map(([operation, sampleInput]) => ({
          title: operation,
          value: {
            ...baseInput,
            arguments: sampleInput,
            info: { fieldName: operation },
          },
        })),
        {
          title: "Digital Imaging Order (via octopus)",
          value: {
            ...baseInput,
            info: { fieldName: "createItem" },
            arguments: {
              input: {
                ...sampleInputs.createItem.input,
                type: IMAGING_REQUEST_ITEM_TYPE,
                payload: {
                  requestType: "Cut out",
                  embeddableUrl:
                    "https://media.test.dev-gutools.co.uk/images/24733ea386c7fcb37496c55cc86e8f1468b9dfcf",
                },
              },
            },
          },
        },
      ],
    });

    console.log(JSON.stringify(await handler(inputPayload), null, 2));
  }
})();
