import {
  ApolloError,
  useLazyQuery,
  useQuery,
  useSubscription,
} from "@apollo/client";
import React, { useContext, useEffect, useState } from "react";
import { Item, User } from "../../shared/graphql/graphql";
import {
  gqlGetPinboardByComposerId,
  gqlGetPinboardsByIds,
  gqlOnCreateItem,
} from "../gql";
import { EXPAND_PINBOARD_QUERY_PARAM } from "./app";
import type { PayloadAndType } from "./types/PayloadAndType";
import type { PerPinboard } from "./types/PerPinboard";
import type {
  PinboardData,
  PreselectedPinboard,
} from "../../shared/graphql/extraTypes";
import { isPinboardData } from "../../shared/graphql/extraTypes";

interface GlobalStateContextShape {
  userEmail: string;
  userLookup: { [email: string]: User } | undefined;

  activePinboardIds: string[];
  activePinboards: PinboardData[];

  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;

  openPinboard: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  preselectedPinboard: PreselectedPinboard;
  selectedPinboardId: string | null | undefined;
  clearSelectedPinboard: () => void;

  showNotification: (item: Item) => void;
  hasWebPushSubscription: boolean | null | undefined;

  errors: PerPinboard<ApolloError>;
  hasError: boolean;
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  hasErrorOnOtherPinboard: (pinboardId: string) => boolean;

  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;

  unreadFlags: PerPinboard<boolean>;
  setUnreadFlag: (
    pinboardId: string
  ) => (unreadFlag: boolean | undefined) => void;
  hasUnread: boolean;
  hasUnreadOnOtherPinboard: (pinboardId: string) => boolean;

  presetUnreadNotificationCount: number | undefined;
}
const GlobalStateContext = React.createContext<GlobalStateContextShape | null>(
  null
);

// Ugly but allows us to assume that the context has been set, which it always will be
export const useGlobalStateContext = (): GlobalStateContextShape => {
  const ctx = useContext(GlobalStateContext);
  if (ctx === null) {
    throw new Error("GlobalStateContext is uninitialised");
  }
  return ctx;
};

interface GlobalStateProviderProps {
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
export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({
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
  children,
}) => {
  const [manuallyOpenedPinboardIds, setManuallyOpenedPinboardIds] = useState<
    string[]
  >([]);

  const [getPreselectedPinboard, preselectedPinboardQuery] = useLazyQuery(
    gqlGetPinboardByComposerId
  );

  const preselectedPinboard = ((): PreselectedPinboard => {
    if (!preselectedComposerId) {
      return;
    }
    if (preselectedPinboardQuery.data?.getPinboardByComposerId) {
      return preselectedPinboardQuery.data.getPinboardByComposerId;
    }
    if (preselectedPinboardQuery.loading) {
      return "loading";
    }
    return "notTrackedInWorkflow";
  })();

  const activePinboardIds = isPinboardData(preselectedPinboard)
    ? [preselectedPinboard.id]
    : manuallyOpenedPinboardIds;

  const activePinboardsQuery = useQuery<{
    getPinboardsByIds: PinboardData[];
  }>(gqlGetPinboardsByIds, {
    variables: {
      ids: activePinboardIds,
    },
  });

  useEffect(() => {
    if (isExpanded) {
      activePinboardsQuery.refetch();
      activePinboardsQuery.startPolling(5000);
    } else {
      activePinboardsQuery.stopPolling();
    }
  }, [isExpanded, activePinboardIds]);

  const activePinboards: PinboardData[] =
    activePinboardsQuery.data?.getPinboardsByIds || [];

  const [selectedPinboardId, setSelectedPinboardId] = useState<string | null>(
    null
  );

  useEffect(
    () =>
      setSelectedPinboardId(
        isPinboardData(preselectedPinboard) ? preselectedPinboard.id : null
      ),
    [preselectedPinboard]
  );

  const clearSelectedPinboard = () => setSelectedPinboardId(null);

  useEffect(() => {
    if (isExpanded && preselectedComposerId) {
      preselectedPinboardQuery.stopPolling();
      getPreselectedPinboard({
        variables: { composerId: preselectedComposerId },
      });
      preselectedPinboardQuery.startPolling(5000);
    } else {
      preselectedPinboardQuery.stopPolling();
    }
  }, [isExpanded, preselectedComposerId]);

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
        : setManuallyOpenedPinboardIds([
            ...manuallyOpenedPinboardIds,
            pinboardData.id,
          ]);
    }

    if (
      !isPinboardData(preselectedPinboard) ||
      preselectedPinboard.id === pinboardData.id
    ) {
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
    hasError &&
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
    hasUnread &&
    !!Object.entries(unreadFlags).find(
      ([otherPinboardId, isUnread]) =>
        isUnread && pinboardId !== otherPinboardId
    );

  const closePinboard = (pinboardIdToClose: string) => {
    if (activePinboardIds.includes(pinboardIdToClose)) {
      setManuallyOpenedPinboardIds([
        ...manuallyOpenedPinboardIds.filter(
          (pinboardId) => pinboardId !== pinboardIdToClose
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

  const contextValue = {
    userEmail,
    userLookup,

    activePinboards,
    activePinboardIds,

    payloadToBeSent,
    clearPayloadToBeSent,

    openPinboard,
    closePinboard,
    preselectedPinboard,
    selectedPinboardId,
    clearSelectedPinboard,

    showNotification,
    hasWebPushSubscription,

    errors,
    hasError,
    setError,
    hasErrorOnOtherPinboard,

    isExpanded,
    setIsExpanded,

    unreadFlags,
    hasUnread,
    setUnreadFlag,
    hasUnreadOnOtherPinboard,

    presetUnreadNotificationCount,
  };

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};
