import { PendingItem } from "../types/PendingItem";
import { Item, User } from "../../../shared/graphql/graphql";
import { demoPinboardData, demoUser } from "./tourConstants";

export const pendingAsReceivedItem = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally dropping pending key
  pending,
  ...item
}: PendingItem): Item => item;

const buildMessageItem = (
  user: User,
  message: string,
  precedingItem: Item
): Item => ({
  id: crypto.randomUUID(), // FIXME this probably wants to be a sequential ID, to help with seenBy/unread logic
  message,
  timestamp: new Date(
    new Date(precedingItem.timestamp).getTime() + 250
  ).toISOString(),
  type: "message-only",
  userEmail: user.email,
  groupMentions: null,
  mentions: null,
  payload: null,
  relatedItemId: null,
  deletedAt: null,
  editHistory: null,
  claimedByEmail: null,
  claimable: false,
  pinboardId: demoPinboardData.id,
});

export const replyTo = (
  demoMentionableUser: User,
  newItem: PendingItem,
  successfulSends: PendingItem[]
): Item[] => {
  if (
    successfulSends.length === 0 &&
    (newItem.mentions || []).length === 0 &&
    (newItem.groupMentions || []).length === 0
  ) {
    return [
      buildMessageItem(
        demoUser,
        "Awesome! You've sent your first Pinboard message 🎉 Now let's try mentioning someone.",
        newItem
      ),
    ];
  }

  if (newItem.mentions && newItem.mentions.length > 0) {
    return [
      buildMessageItem(
        demoMentionableUser,
        "Hey, thanks for mentioning me!",
        newItem
      ),
    ];
  }

  return [];
};
