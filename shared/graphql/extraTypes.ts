import type { Group, User, WorkflowStub } from "./graphql";

export type PinboardData = WorkflowStub;

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

export const isGroup = (userOrGroup: User | Group): userOrGroup is Group =>
  "shorthand" in userOrGroup;

export const isUser = (userOrGroup: User | Group): userOrGroup is User =>
  !isGroup(userOrGroup);
