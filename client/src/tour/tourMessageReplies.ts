import { PendingItem } from "../types/PendingItem";
import { Item } from "../../../shared/graphql/graphql";
import { demoPinboardData, demoUser } from "./tourConstants";

const pendingAsReceivedItem = ({ pending, ...item }: PendingItem) => item;

const buildMessageItem = (message: string, precedingItem: Item): Item => ({
  id: crypto.randomUUID(),
  message,
  timestamp: new Date(
    new Date(precedingItem.timestamp).getTime() + 250
  ).toISOString(),
  type: "message-only",
  userEmail: demoUser.email,
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

export const buildTourSubscriptionItems = (successfulSends: PendingItem[]) => {
  if (successfulSends.length === 1) {
    return [
      pendingAsReceivedItem(successfulSends[0]),
      buildMessageItem(
        "Awesome! You've sent your first Pinboard message 🎉 Now you can proceed to the next step...",
        successfulSends[0]
      ),
    ];
  }
  return [];
};
