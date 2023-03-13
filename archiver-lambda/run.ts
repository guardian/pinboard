import { handler } from "./src";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";

(async () => {
  const stage = await createDatabaseTunnel();
  if (stage === "PROD") {
    throw Error("Cannot run locally against PROD database");
  }
  await handler();
})();
