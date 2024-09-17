import { CreateItemInput } from "shared/graphql/graphql";
import { AppSyncConfig } from "shared/appSyncConfig";
import { itemReturnFields } from "shared/itemReturnFields";
import fetch from "node-fetch";

export const appSyncCreateItem = (
  config: AppSyncConfig,
  input: CreateItemInput
) =>
  fetch(config.graphqlEndpoint, {
    method: "POST",
    headers: {
      authorization: config.authToken,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      operationName: "SendMessage",
      variables: {
        input,
      },
      // the client listening to the subscription requires various fields to be returned, hence reuse of itemReturnFields
      query: `mutation SendMessage($input: CreateItemInput!) { createItem(input: $input) { ${itemReturnFields} } }`,
    }),
  });
