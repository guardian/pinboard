import { gql } from "@apollo/client";

const pinboardReturnFields = `
  composerId
  id
  status
  title
`;
export const gqlListPinboards = gql`
  query MyQuery {
    listPinboards { ${pinboardReturnFields} }
  }
`;
export const gqlGetPinboard = (composerId: string | undefined) => gql`
  query MyQuery {
    getPinboardByComposerId(composerId: "${composerId}") { ${pinboardReturnFields} }
  }
`;

const itemReturnFields = `
  id
  type
  user
  timestamp
  pinboardId
  message
  payload
`;
// TODO: consider updating the resolver (cdk/stack.ts) to use a Query with a secondary index (if performance degrades when we have lots of items)
export const gqlGetInitialItems = (pinboardId: string) => gql`
  query MyQuery {
    listItems(filter: { pinboardId: { eq: "${pinboardId}" } }) {
      items { ${itemReturnFields} }
    }
  }
`;
export const gqlCreateItem = gql`
  mutation SendMessage($input: CreateItemInput!) {
    createItem(input: $input) {
      # including fields here makes them accessible in our subscription data
      ${itemReturnFields}
    }
  }
`;
export const gqlOnCreateItem = (pinboardId: string) => gql`
  subscription OnCreateItem {
    onCreateItem(pinboardId: "${pinboardId}") { ${itemReturnFields} }
  }
`;
