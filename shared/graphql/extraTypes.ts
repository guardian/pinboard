import type {
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
  | "unknown"
  | undefined;

export const isPinboardData = (
  maybePinboardData: PreselectedPinboard
): maybePinboardData is PinboardData =>
  !!maybePinboardData &&
  maybePinboardData !== "loading" &&
  maybePinboardData !== "notTrackedInWorkflow" &&
  maybePinboardData !== "unknown";

export const isPinboardDataWithClaimCounts = (
  pinboardData: PinboardData | PinboardDataWithClaimCounts
): pinboardData is PinboardDataWithClaimCounts =>
  "unclaimedCount" in pinboardData;

export const isGroup = (userOrGroup: User | Group): userOrGroup is Group =>
  "shorthand" in userOrGroup;

export const isUser = (userOrGroup: User | Group): userOrGroup is User =>
  !isGroup(userOrGroup);
