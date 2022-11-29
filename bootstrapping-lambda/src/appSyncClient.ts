import axios from "axios";
// FIXME - figure out how to use node-fetch here
import { AppSyncConfig } from "../../shared/appSyncConfig";

export const getAppSyncClient = (appSyncConfig: AppSyncConfig) => {
  const { graphqlEndpoint, authToken } = appSyncConfig;

  return async (
    operation: string,
    query: string,
    variables?: Record<string, unknown>
  ) => {
    const response = await axios({
      method: "post",
      url: graphqlEndpoint,
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
        accept: "text/plain",
      },
      data: { query, variables },
    });

    // @ts-ignore
    const { data, errors } = await response;
    if (errors) {
      throw new Error(JSON.stringify(errors));
    }
    return { authToken, data };
  };
};
