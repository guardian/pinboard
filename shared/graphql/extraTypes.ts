import type {
  ChatBot,
  Group,
  PinboardIdWithClaimCounts,
  User,
  WorkflowStub,
} from "./graphql";

export type PinboardData = WorkflowStub;

export type PinboardDataWithClaimCounts = Omit<PinboardData, "__typename"> &
  Omit<PinboardIdWithClaimCounts, "__typename">;

export type PreselectedPinboard =
  | PinboardData
  | "loading"
  | "notTrackedInWorkflow"
  | undefined;

export const isPinboardData = (
  maybePinboardData: PreselectedPinboard
): maybePinboardData is PinboardData =>
  !!maybePinboardData &&
  maybePinboardData !== "loading" &&
  maybePinboardData !== "notTrackedInWorkflow";

export const isPinboardDataWithClaimCounts = (
  pinboardData: PinboardData | PinboardDataWithClaimCounts
): pinboardData is PinboardDataWithClaimCounts =>
  "unclaimedCount" in pinboardData;

export const isGroup = (
  userOrGroupOrChatBot: User | Group | ChatBot | undefined
): userOrGroupOrChatBot is Group =>
  !!userOrGroupOrChatBot && "memberEmails" in userOrGroupOrChatBot;

export const isUser = (
  userOrGroupOrChatBot: User | Group | ChatBot | undefined
): userOrGroupOrChatBot is User =>
  !!userOrGroupOrChatBot && "email" in userOrGroupOrChatBot;

export const isChatBot = (
  userOrGroupOrChatBot: User | Group | ChatBot | undefined
): userOrGroupOrChatBot is ChatBot =>
  !!userOrGroupOrChatBot && "description" in userOrGroupOrChatBot;

export const hasAvatarUrl = (
  userOrGroupOrChatBot: User | Group | ChatBot | undefined
): userOrGroupOrChatBot is User | ChatBot =>
  !!userOrGroupOrChatBot && "avatarUrl" in userOrGroupOrChatBot;
