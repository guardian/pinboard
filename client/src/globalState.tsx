import { ApolloError, useLazyQuery, useSubscription } from "@apollo/client";
import React, { useContext, useEffect, useState } from "react";
import { Item, User, WorkflowStub } from "../../shared/graphql/graphql";
import { gqlGetPinboardByComposerId, gqlOnCreateItem } from "../gql";
import { EXPAND_PINBOARD_QUERY_PARAM } from "./app";
import { Floaty } from "./floaty";
import { Panel } from "./panel";
import type { PinboardData } from "./pinboard";
import type { PayloadAndType } from "./types/PayloadAndType";
import type { PerPinboard } from "./types/PerPinboard";

interface GlobalStateContextShape {
  userEmail: string;
  userLookup: { [email: string]: User } | undefined;

  activePinboardIds: string[];
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;

  openPinboard: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  preselectedPinboard: WorkflowStub | undefined;
  selectedPinboardId: string | null | undefined;
  clearSelectedPinboard: () => void;

  showNotification: (item: Item) => void;
  hasWebPushSubscription: boolean | null | undefined;

  errors: PerPinboard<ApolloError>;
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  hasErrorOnOtherPinboard: (pinboardId: string) => boolean;

  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;

  unreadFlags: PerPinboard<boolean>;
  setUnreadFlag: (
    pinboardId: string
  ) => (unreadFlag: boolean | undefined) => void;
  hasUnreadOnOtherPinboard: (pinboardId: string) => boolean;
}
const GlobalStateContext = React.createContext<GlobalStateContextShape | null>(
  null
);

const GlobalStateContextProvider = GlobalStateContext.Provider;

// Ugly but allows us to assume that the context has been set, which it always will be
export const useGlobalStateContext = (): GlobalStateContextShape => {
  const ctx = useContext(GlobalStateContext);
  if (ctx === null) {
    throw new Error("GlobalStateContext is uninitialised");
  }
  return ctx;
};

interface GlobalStateProps {
  userEmail: string;
  preselectedComposerId: string | null | undefined;
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  userLookup: { [email: string]: User } | undefined;
  hasWebPushSubscription: boolean | null | undefined;
  showNotification: (item: Item) => void;
  clearDesktopNotificationsForPinboardId: (pinboardId: string) => void;
  presetUnreadNotificationCount: number | undefined;
}
export const GlobalState: React.FC<GlobalStateProps> = ({
  userEmail,
  preselectedComposerId,
  presetUnreadNotificationCount,
  payloadToBeSent,
  clearPayloadToBeSent,
  isExpanded,
  setIsExpanded,
  userLookup,
  hasWebPushSubscription,
  showNotification,
  clearDesktopNotificationsForPinboardId,
}) => {
  const [manuallyOpenedPinboards, setManuallyOpenedPinboards] = useState<
    PinboardData[]
  >([]);

  const [getPreselectedPinboard, preselectedPinboardQuery] = useLazyQuery(
    gqlGetPinboardByComposerId
  );
  useEffect(() => {
    preselectedComposerId &&
      getPreselectedPinboard({
        variables: {
          composerId: preselectedComposerId,
        },
      });
  }, [preselectedComposerId]);

  const preselectedPinboard: PinboardData | undefined =
    preselectedComposerId &&
    preselectedPinboardQuery.data?.getPinboardByComposerId;

  const activePinboards: PinboardData[] = preselectedPinboard
    ? [preselectedPinboard]
    : manuallyOpenedPinboards;

  const activePinboardIds = activePinboards.map((_) => _.id);

  const [selectedPinboardId, setSelectedPinboardId] = useState<string | null>();

  useEffect(() => setSelectedPinboardId(preselectedPinboard?.id), [
    preselectedPinboard,
  ]);

  const clearSelectedPinboard = () => setSelectedPinboardId(null);

  const openPinboard = (pinboardData: PinboardData) => {
    const hostname = window.location.hostname;
    const composerDomain =
      hostname.includes(".local.") ||
      hostname.includes(".code.") ||
      hostname.includes(".test.")
        ? "code.dev-gutools.co.uk"
        : "gutools.co.uk";
    const composerUrl = `https://composer.${composerDomain}/content/${
      pinboardData.composerId || ".."
    }?${EXPAND_PINBOARD_QUERY_PARAM}=true`;
    if (!activePinboardIds.includes(pinboardData.id)) {
      preselectedPinboard
        ? window?.open(composerUrl, "_blank")?.focus()
        : setManuallyOpenedPinboards([
            ...manuallyOpenedPinboards,
            pinboardData,
          ]);
    }

    if (!preselectedPinboard || preselectedPinboard.id === pinboardData.id) {
      setSelectedPinboardId(pinboardData.id);
    }
  };

  const [errors, setErrors] = useState<PerPinboard<ApolloError>>({});

  const setError = (pinboardId: string, error: ApolloError | undefined) =>
    setErrors((prevErrors) => ({ ...prevErrors, [pinboardId]: error }));

  const hasError =
    Object.entries(errors).find(
      ([pinboardId, error]) => activePinboardIds.includes(pinboardId) && error
    ) !== undefined;

  const hasErrorOnOtherPinboard = (pinboardId: string): boolean =>
    !!hasError &&
    !!Object.entries(errors).find(
      ([otherPinboardId, isError]) => isError && pinboardId !== otherPinboardId
    );

  const [unreadFlags, setUnreadFlags] = useState<PerPinboard<boolean>>({});

  const setUnreadFlag = (pinboardId: string) => (
    unreadFlag: boolean | undefined
  ) => {
    setUnreadFlags((prevUnreadFlags) => ({
      ...prevUnreadFlags,
      [pinboardId]: unreadFlag,
    }));
    !unreadFlag && clearDesktopNotificationsForPinboardId(pinboardId);
  };

  const hasUnread =
    Object.values(unreadFlags).find((unreadFlag) => unreadFlag) || false;

  const hasUnreadOnOtherPinboard = (pinboardId: string): boolean =>
    !!hasUnread &&
    !!Object.entries(unreadFlags).find(
      ([otherPinboardId, isUnread]) =>
        isUnread && pinboardId !== otherPinboardId
    );

  const closePinboard = (pinboardIdToClose: string) => {
    if (activePinboardIds.includes(pinboardIdToClose)) {
      setManuallyOpenedPinboards([
        ...manuallyOpenedPinboards.filter(
          (pinboard) => pinboard.id !== pinboardIdToClose
        ),
      ]);
    }
    setSelectedPinboardId(null);
    setUnreadFlag(pinboardIdToClose)(undefined);
    setError(pinboardIdToClose, undefined);
  };

  useSubscription(gqlOnCreateItem(), {
    onSubscriptionData: ({ subscriptionData }) => {
      const { pinboardId, mentions } = subscriptionData.data.onCreateItem;

      const isMentioned = mentions.includes(userEmail); // TODO also check group membership here (once added)

      const pinboardIsOpen = isExpanded && selectedPinboardId === pinboardId;

      if (isMentioned && !pinboardIsOpen) {
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (
        event.source !== window &&
        Object.prototype.hasOwnProperty.call(event.data, "item")
      ) {
        const item = event.data.item;
        window.focus();
        setIsExpanded(true);
        setSelectedPinboardId(item.pinboardId); // FIXME handle if said pinboard is not active (i.e. load data)
        // TODO ideally highlight the item
      }
    });
  }, []);

  const isNotTrackedInWorkflow = Boolean(
    preselectedComposerId &&
      !preselectedPinboard &&
      !preselectedPinboardQuery.loading
  );

  const contextValue = {
    userEmail,
    userLookup,

    activePinboardIds,
    payloadToBeSent,
    clearPayloadToBeSent,

    openPinboard,
    closePinboard,
    preselectedPinboard,
    clearSelectedPinboard,

    showNotification,
    hasWebPushSubscription,

    errors,
    setError,
    hasErrorOnOtherPinboard,

    unreadFlags,
    setUnreadFlag,
    hasUnreadOnOtherPinboard,

    selectedPinboardId,
    isExpanded,
    setIsExpanded,
  };

  return (
    <GlobalStateContextProvider value={contextValue}>
      <Floaty
        presetUnreadNotificationCount={presetUnreadNotificationCount}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        hasError={hasError}
        hasUnread={hasUnread}
      />
      <Panel
        isExpanded={isExpanded}
        isNotTrackedInWorkflow={isNotTrackedInWorkflow}
        activePinboards={activePinboards}
        selectedPinboardId={selectedPinboardId}
      />
    </GlobalStateContextProvider>
  );
};
