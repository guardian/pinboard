export interface AppSyncConfig {
  graphqlEndpoint: string;
  realtimeEndpoint: string;
  apiKey: string;
  userEmail: string; // TODO: this will be eliminated when user is set server-side (once we have OpenId Connect)
}
