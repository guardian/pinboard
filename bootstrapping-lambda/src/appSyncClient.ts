import fetch from "node-fetch";
import { AppSyncConfig } from "../../shared/appSyncConfig";
import {
  REST_VERBS,
  HTTP_CONTENT_TYPES,
} from "../../shared/http/httpClientValues";

export interface AppSyncQuery {
  query: string;
  variables: Record<string, unknown>;
  operation: string;
}

export const getAppSyncClient = (appSyncConfig: AppSyncConfig) => {
  const { graphqlEndpoint, authToken } = appSyncConfig;

  return async ({ query, variables, operation }: AppSyncQuery) => {
    const fetchResponse = await fetch(graphqlEndpoint, {
      method: REST_VERBS.POST,
      headers: {
        "Content-Type": HTTP_CONTENT_TYPES.APPLICATION_JSON,
        Authorization: authToken,
        accept: HTTP_CONTENT_TYPES.APPLICATION_JSON,
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
