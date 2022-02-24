import React, { useContext } from "react";
import type { ApolloError } from "@apollo/client";
import type { Item, User, WorkflowStub } from "../../shared/graphql/graphql";
import type { PinboardData } from "./pinboard";
import type { PayloadAndType } from "./types/PayloadAndType";
import type { PerPinboard } from "./types/PerPinboard";

export interface PinboardContextShape {
  userEmail: string;
  userLookup: { [email: string]: User } | undefined;

  activePinboardIds: string[];
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;

  openPinboard: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  preselectedPinboard: WorkflowStub | undefined;
  clearSelectedPinboard: () => void;

  showNotification: (item: Item) => void;
  hasWebPushSubscription: boolean | null | undefined;

  errors: PerPinboard<ApolloError>;
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  hasErrorOnOtherPinboard: (pinboardId: string) => boolean;

  unreadFlags: PerPinboard<boolean>;
  setUnreadFlag: (
    pinboardId: string
  ) => (unreadFlag: boolean | undefined) => void;
  hasUnreadOnOtherPinboard: (pinboardId: string) => boolean;
}
const PinboardContext = React.createContext<PinboardContextShape | null>(null);

export const PinboardContextProvider = PinboardContext.Provider;

// Ugly but allows us to assume that the context has been set, which it always will be
export const usePinboardContext = (): PinboardContextShape => {
  const ctx = useContext(PinboardContext);
  if (ctx === null) {
    throw new Error("PinboardContext is uninitialised");
  }
  return ctx;
};
