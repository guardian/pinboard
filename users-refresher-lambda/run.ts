import { handler } from "./src";
import { createDbTunnel } from "../shared/database/local/tunnel";

(async () => {
  await createDbTunnel();
  await handler({});
})();
