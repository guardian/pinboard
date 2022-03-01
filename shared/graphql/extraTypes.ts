import type { WorkflowStub } from "./graphql";

export type PreselectedPinboard =
  | WorkflowStub
  | "loading"
  | "notTrackedInWorkflow"
  | undefined;

export const isWorkflowStub = (
  stub: PreselectedPinboard
): stub is WorkflowStub =>
  !!stub && stub !== "loading" && stub !== "notTrackedInWorkflow";
