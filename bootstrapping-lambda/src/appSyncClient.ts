import fetch from "node-fetch";
import { AppSyncConfig } from "../../shared/appSyncConfig";

export interface AppSyncQuery {
  query: string;
  variables: Record<string, unknown>;
  operation: string;
}

export const getAppSyncClient = (appSyncConfig: AppSyncConfig) => {
  const { graphqlEndpoint, authToken } = appSyncConfig;

  return async ({ query, variables, operation }: AppSyncQuery) => {
    const fetchResponse = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
        accept: "application/json",
      },
      body: JSON.stringify({ query, variables, operation }),
    });

    const { data, errors } = await fetchResponse.json();

    if (errors) {
      throw new Error(JSON.stringify(errors));
    }

    return data;
  };
};
