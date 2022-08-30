import { gql } from "@apollo/client";

const pinboardReturnFields = `
  composerId
  id
  status
  title
  headline
  trashed
  isNotFound
`;
export const gqlListPinboards = gql`
  query MyQuery($searchText: String!) {
    listPinboards(searchText: $searchText) { ${pinboardReturnFields} }
  }
`;
export const gqlGetPinboardByComposerId = gql`
  query MyQuery($composerId: String!) {
    getPinboardByComposerId(composerId: $composerId) { ${pinboardReturnFields} }
  }
`;
export const gqlGetPinboardsByIds = gql`
  query MyQuery($ids: [String!]!) {
    getPinboardsByIds(ids: $ids) { ${pinboardReturnFields} }
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
    listItems(pinboardId: "${pinboardId}") {
      ${itemReturnFields}
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

const myUserReturnFields = `${userReturnFields}
  hasWebPushSubscription
  manuallyOpenedPinboardIds
`;

export const gqlGetAllUsers = gql`
    query MyQuery {
        listUsers {
            items { ${userReturnFields}
                isMentionable
            }
        }
    }
`;

export const gqlGetMyUser = gql`
query MyQuery {
  getMyUser {
    ${myUserReturnFields}
  }
}
`;

export const gqlSetWebPushSubscriptionForUser = gql`
  mutation SetWebPushSubscriptionForUser($webPushSubscription: AWSJSON) {
    setWebPushSubscriptionForUser(webPushSubscription: $webPushSubscription) {
      ${myUserReturnFields}
    }
  }
`;

export const gqlAddManuallyOpenedPinboardIds = gql`
  mutation AddManuallyOpenedPinboardIds($ids: [String!]!, $maybeEmailOverride: String) {
    addManuallyOpenedPinboardIds(ids: $ids, maybeEmailOverride: $maybeEmailOverride) {
      # including fields here makes them accessible in our subscription data
      ${myUserReturnFields}
    }
  }
`;
export const gqlRemoveManuallyOpenedPinboardIds = gql`
  mutation RemoveManuallyOpenedPinboardIds($ids: [String!]!) {
    removeManuallyOpenedPinboardIds(ids: $ids) {
      # including fields here makes them accessible in our subscription data
      ${myUserReturnFields}
    }
  }
`;

export const gqlOnManuallyOpenedPinboardIdsChanged = (userEmail: string) => gql`
    subscription OnManuallyOpenedPinboardIdsChanged {
        onManuallyOpenedPinboardIdsChanged(email: "${userEmail}") { 
            ${myUserReturnFields} 
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
    listLastItemSeenByUsers(pinboardId: "${pinboardId}") {
      ${lastItemSeenByUserReturnFields}
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

const gridBadgeFields = `
  text
  color
`;

export const gqlGetGridSearchSummary = gql`
  query MyQuery($apiUrl: String!) {
    getGridSearchSummary(apiUrl: $apiUrl) {
      total
      thumbnails
      queryBreakdown {
        collections { ${gridBadgeFields} }
        labels { ${gridBadgeFields} }
        chips { ${gridBadgeFields} }
        restOfSearch
      }
    }
  }
`;
