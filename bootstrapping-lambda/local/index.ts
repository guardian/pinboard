import { initEnvVars } from "./initLocalEnvVars";

initEnvVars().then(() => {
  import("../src/server"); // actually start the server, once the environment variables are set
});
