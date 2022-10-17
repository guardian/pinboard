import { handler } from "./src";
import { AppSyncResolverEvent } from "aws-lambda/trigger/appsync-resolver";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";
import prompts from "prompts";

const baseInput = {
  identity: { resolverContext: { userEmail: "foo@bar.com" } },
};

const sampleInputs = {
  listItems: { pinboardId: "123" },
  searchMentionableUsers: { prefix: "a" },
};

(async () => {
  await createDatabaseTunnel();

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
})();
