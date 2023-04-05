import { PendingItem } from "../types/PendingItem";
import { Item } from "../../../shared/graphql/graphql";
import { demoPinboardData, demoUser } from "./tourConstants";

export const pendingAsReceivedItem = ({
  pending,
  ...item
}: PendingItem): Item => item;

const buildMessageItem = (message: string, precedingItem: Item): Item => ({
  id: crypto.randomUUID(),
  message,
  timestamp: new Date(
    new Date(precedingItem.timestamp).getTime() + 250
  ).toISOString(),
  type: "message-only",
  userEmail: demoUser.email, // TODO - reply from person mentioned in preceding item
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
  newItem: PendingItem,
  successfulSends: PendingItem[]
): Item[] => {
  if (
    successfulSends.length === 0 &&
    newItem.mentions.length === 0 &&
    newItem.groupMentions.length === 0
  ) {
    return [
      buildMessageItem(
        "Awesome! You've sent your first Pinboard message 🎉 You can ...",
        newItem
      ),
    ];
  }

  if (newItem.mentions.length > 0) {
    return [buildMessageItem("Hey, thanks for mentioning me!", newItem)];
  }
};
