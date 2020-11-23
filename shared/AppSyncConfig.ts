import {User} from "./User";

export interface AppSyncConfig { //TODO broaden this name and/or move the 3 config items into a sub object
  graphqlEndpoint: string;
  realtimeEndpoint: string;
  apiKey: string;
  user: User;
}
