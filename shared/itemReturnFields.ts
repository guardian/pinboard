export const itemReturnFields = `
  id
  type
  userEmail
  timestamp
  pinboardId
  message
  payload
  mentions {
    label
    isMe
  }
  groupMentions {
    label
    isMe
  }
  claimedByEmail
  claimable
  relatedItemId
  editHistory
  deletedAt
`;
