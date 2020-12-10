import { User } from "./User";

//TODO broaden this name and/or move the 3 config items into a sub object
export interface AppSyncConfig {
  graphqlEndpoint: string;
  realtimeEndpoint: string;
  apiKey: string;
  user: User;
}
