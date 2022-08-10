import type { Item, WorkflowStub } from "./graphql";

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

export const isItem = (maybeItem: unknown): maybeItem is Item =>
  !!maybeItem && typeof maybeItem === "object" && "pinboardId" in maybeItem;
