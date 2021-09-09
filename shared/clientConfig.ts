import { AppSyncConfig } from "./appSyncConfig";

export interface ClientConfig {
  appSyncConfig: AppSyncConfig;
  userEmail: string; // TODO: this will be eliminated when user is set server-side (once we have OpenId Connect)
}
