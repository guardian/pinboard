import { AppSyncConfig } from "./appSyncConfig";
import { Stage } from "./types/stage";

export interface ClientConfig {
  sentryDSN: string;
  appSyncConfig: AppSyncConfig;
  userEmail: string; // TODO: this will be eliminated when user is set server-side (once we have OpenId Connect)
  permissions: string[];
  stage: Stage;
}
