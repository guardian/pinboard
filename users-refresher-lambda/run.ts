import { handler } from "./src";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";

(async () => {
  await createDatabaseTunnel();
  await handler({});
})();
