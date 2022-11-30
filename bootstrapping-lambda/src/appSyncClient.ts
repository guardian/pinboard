import axios from "axios";
// FIXME - figure out how to use node-fetch here
import { AppSyncConfig } from "../../shared/appSyncConfig";

export interface AppSyncQuery {
  query: string;
  variables: Record<string, unknown>;
  operation: string;
}

export const getAppSyncClient = (appSyncConfig: AppSyncConfig) => {
  const { graphqlEndpoint, authToken } = appSyncConfig;

  return async ({ query, variables, operation }: AppSyncQuery) => {
    const response = await axios({
      method: "post",
      url: graphqlEndpoint,
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
        accept: "application/json",
      },
      data: { query, variables, operation },
    });

    // @ts-ignore
    const { data, errors } = await response;
    if (errors) {
      throw new Error(JSON.stringify(errors));
    }
    return { authToken, data };
  };
};
