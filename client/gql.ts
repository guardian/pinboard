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
export const gqlGetPinboardByComposerId = gql`
  query MyQuery($composerId: String!) {
    getPinboardByComposerId(composerId: $composerId) { ${pinboardReturnFields} }
  }
`;

const itemReturnFields = `
  id
  type
  userEmail
  timestamp
  pinboardId
  message
  payload
  mentions
`;
const mentionReturnFields = `
  pinboardId
  mentions
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
export const gqlOnCreateItem = (pinboardId?: string) =>
  pinboardId
    ? gql`
  subscription OnCreateItem {
    onCreateItem(pinboardId: "${pinboardId}") { ${itemReturnFields} }
  }
`
    : gql`
  subscription OnCreateItem {
    onCreateItem { ${mentionReturnFields} }
  }
`;

const userReturnFields = `
  email
  firstName
  lastName
  avatarUrl
`;

const userReturnFieldsWithHasWebPushSubscription = `${userReturnFields}
  hasWebPushSubscription
`;

export const gqlGetAllUsers = gql`
query MyQuery {
  searchUsers {
    items { ${userReturnFields} }
  }
}
`;

export const gqlGetUser = (email: string) => gql`
query MyQuery {
  getUser(email: "${email}") {
    ${userReturnFieldsWithHasWebPushSubscription}
  }
}
`;

export const gqlSetWebPushSubscriptionForUser = gql`
  mutation SetWebPushSubscriptionForUser($userEmail: String!, $webPushSubscription: AWSJSON) {
    setWebPushSubscriptionForUser(userEmail: $userEmail, webPushSubscription: $webPushSubscription) {
      ${userReturnFieldsWithHasWebPushSubscription}
    }
  }
`;

const lastItemSeenByUserReturnFields = `
  pinboardId
  userEmail
  itemID
  seenAt    
`;

export const gqlGetLastItemSeenByUsers = (pinboardId: string) => gql`
  query MyQuery {
    listLastItemSeenByUsers(filter: { pinboardId: { eq: "${pinboardId}" } }) {
      items { ${lastItemSeenByUserReturnFields} }
    }
  }
`;

export const gqlOnSeenItem = (pinboardId: string) => gql`
  subscription OnSeenItem {
    onSeenItem(pinboardId: "${pinboardId}") { ${lastItemSeenByUserReturnFields} }
  }
`;

export const gqlSeenItem = gql`
  mutation SeeItem($input: LastItemSeenByUserInput!) {
    seenItem(input: $input) {
      # including fields here makes them accessible in our subscription data
      ${lastItemSeenByUserReturnFields}
    }
  }
`;
