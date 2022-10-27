import { handler } from "./src";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";
import prompts from "prompts";

(async () => {
  const { inputEvent } = await prompts({
    type: "select",
    name: "inputEvent",
    message: "",
    choices: [
      { title: "FULL RUN", value: {}, selected: true },
      {
        title: "process permission changes only",
        value: { isProcessPermissionChangesOnly: true },
      },
    ],
  });
  await createDatabaseTunnel();
  await handler(inputEvent);
})();
