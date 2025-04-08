import {
  ApolloError,
  useLazyQuery,
  useMutation,
  useQuery,
  useSubscription,
} from "@apollo/client";
import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Claimed,
  Item,
  LastItemSeenByUser,
  MyUser,
} from "../../shared/graphql/graphql";
import {
  gqlAddManuallyOpenedPinboardIds,
  gqlGetPinboardByComposerId,
  gqlGetPinboardsByIds,
  gqlOnClaimItem,
  gqlOnMutateItem,
  gqlOnSeenItem,
  gqlRemoveManuallyOpenedPinboardIds,
} from "../gql";
import type {
  PayloadAndType,
  PayloadWithThumbnail,
} from "./types/PayloadAndType";
import type { PerPinboard } from "./types/PerPinboard";
import type { PinboardData } from "../../shared/graphql/extraTypes";
import { isPinboardData } from "../../shared/graphql/extraTypes";
import type { PreselectedPinboard } from "../../shared/graphql/extraTypes";
import { ChatTab, Tab } from "./types/Tab";
import { ControlPosition } from "react-draggable";
import { bottom, top, floatySize, right } from "./styling";
import {
  EXPAND_PINBOARD_QUERY_PARAM,
  OPEN_PINBOARD_QUERY_PARAM,
} from "../../shared/constants";
import { UserLookup } from "./types/UserLookup";
import { demoPinboardData } from "./tour/tourConstants";
import { readAndThenSilentlyDropQueryParamFromURL } from "./util";
import { FeatureFlags } from "./featureFlags";

const LOCAL_STORAGE_KEY_EXPLICIT_POSITION = "pinboard-explicit-position";

const getHasBrowserFocus = () =>
  document.visibilityState === "visible" && document.hasFocus();

interface GlobalStateContextShape {
  userEmail: string;
  userLookup: UserLookup;
  addEmailsToLookup: (emails: string[]) => void;

  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  isLoadingActivePinboardList: boolean;
  activePinboardIds: string[];
  activePinboards: PinboardData[];

  allSubscriptionItems: Item[];
  allSubscriptionClaimedItems: Item[]; // both the updated 'claimed' item and the new 'claim' item
  allSubscriptionOnSeenItems: LastItemSeenByUser[];
  totalItemsReceivedViaSubscription: number;
  totalOfMyOwnOnSeenItemsReceivedViaSubscription: number;

  payloadToBeSent: PayloadAndType | null;
  setPayloadToBeSent: (newPayloadToBeSent: PayloadAndType | null) => void;
  clearPayloadToBeSent: () => void;

  addManuallyOpenedPinboardId: (
    isDemo: false // this asks the compiler to ensure we never call this in demo mode
  ) => (pinboardId: string, maybeEmailOverride?: string) => void;
  openPinboard: (
    isDemo: boolean
  ) => (pinboardData: PinboardData, isOpenInNewTab: boolean) => void;
  peekAtPinboard: (pinboardId: string, maybeItemIdToHighlight?: string) => void;
  openPinboardInNewTab: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  preselectedPinboard: PreselectedPinboard;
  cropsOnPreselectedPinboard: Array<[PayloadWithThumbnail, Item]>;
  setCropsOnPreselectedPinboard: (
    crops: Array<[PayloadWithThumbnail, Item]>
  ) => void;
  selectedPinboardId: string | null | undefined;
  clearSelectedPinboard: () => void;

  openInTool: string | null;

  maybeItemIdToHighlight: string | null;
  clearMaybeItemIdToHighlight: () => void;

  hasEverUsedTour: boolean | undefined;
  visitTourStep: (tourStepId: string) => void;

  featureFlags: FeatureFlags;

  showNotification: (item: Item) => void;
  hasWebPushSubscription: boolean | null | undefined;

  errors: PerPinboard<ApolloError>;
  hasError: boolean;
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  hasErrorOnOtherPinboard: (pinboardId: string) => boolean;

  hasBrowserFocus: boolean;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;

  unreadFlags: PerPinboard<boolean>;
  setUnreadFlag: (
    pinboardId: string
  ) => (unreadFlag: boolean | undefined) => void;
  hasUnread: boolean;
  hasUnreadOnOtherPinboard: (pinboardId: string) => boolean;

  presetUnreadNotificationCount: number | undefined;

  isRepositioning: boolean;
  setIsRepositioning: (isRepositioning: boolean) => void;

  explicitPositionTranslation: ControlPosition;
  setExplicitPositionTranslation: (newPosition: ControlPosition) => void;
  boundedPositionTranslation: ControlPosition;
  updateBoundedPositionTranslation: (newPosition: ControlPosition) => void;
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
  hasApolloAuthError: boolean;
  userEmail: string;
  preselectedComposerId: string | null | undefined;
  openInTool: string | null;
  payloadToBeSent: PayloadAndType | null;
  setPayloadToBeSent: (newPayloadToBeSent: PayloadAndType | null) => void;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  userLookup: UserLookup;
  addEmailsToLookup: (emails: string[]) => void;
  hasWebPushSubscription: boolean | null | undefined;
  manuallyOpenedPinboardIds: string[];
  updateUserWithChanges: (newMyUser: MyUser) => void;
  showNotification: (item: Item) => void;
  clearDesktopNotificationsForPinboardId: (pinboardId: string) => void;
  presetUnreadNotificationCount: number | undefined;
  hasEverUsedTour: boolean | undefined;
  visitTourStep: (tourStepId: string) => void;
  featureFlags: FeatureFlags;
  maybeInlineSelectedPinboardId?: string | null;
}

export const GlobalStateProvider = ({
  hasApolloAuthError,
  userEmail,
  preselectedComposerId,
  openInTool,
  presetUnreadNotificationCount,
  payloadToBeSent,
  setPayloadToBeSent,
  isExpanded,
  setIsExpanded,
  userLookup,
  addEmailsToLookup,
  hasWebPushSubscription,
  manuallyOpenedPinboardIds,
  updateUserWithChanges,
  showNotification,
  clearDesktopNotificationsForPinboardId,
  hasEverUsedTour,
  visitTourStep,
  featureFlags,
  children,
  maybeInlineSelectedPinboardId,
}: PropsWithChildren<GlobalStateProviderProps>) => {
  const [activeTab, setActiveTab] = useState<Tab>(ChatTab);

  useEffect(() => {
    payloadToBeSent && setActiveTab(ChatTab);
  }, [payloadToBeSent]);

  const [getPreselectedPinboard, preselectedPinboardQuery] = useLazyQuery(
    gqlGetPinboardByComposerId
  );

  const preselectedPinboard = ((): PreselectedPinboard => {
    if (!preselectedComposerId) {
      return;
    }
    if (preselectedComposerId === "unknown") {
      return "unknown";
    }
    if (
      preselectedPinboardQuery.data?.getPinboardByComposerId &&
      !preselectedPinboardQuery.data.getPinboardByComposerId.isNotFound
    ) {
      return preselectedPinboardQuery.data.getPinboardByComposerId;
    }
    if (preselectedPinboardQuery.loading) {
      return "loading";
    }
    return "notTrackedInWorkflow";
  })();

  const preselectedPinboardId =
    isPinboardData(preselectedPinboard) && preselectedPinboard.id;

  const [cropsOnPreselectedPinboard, setCropsOnPreselectedPinboard] = useState<
    Array<[PayloadWithThumbnail, Item]>
  >([]);

  const [
    maybeOpenPinboardIdBasedOnQueryParam,
    setMaybeOpenPinboardIdBasedOnQueryParam,
  ] = useState<string | null>(null);

  useEffect(() => {
    const openPinboardIdBasedOnQueryParam =
      readAndThenSilentlyDropQueryParamFromURL(OPEN_PINBOARD_QUERY_PARAM);
    const shouldExpandPinboardBasedOnQueryParam =
      readAndThenSilentlyDropQueryParamFromURL(
        EXPAND_PINBOARD_QUERY_PARAM
      )?.toLowerCase() === "true";
    if (shouldExpandPinboardBasedOnQueryParam) {
      setIsExpanded(true);
    }
    if (openPinboardIdBasedOnQueryParam) {
      setIsExpanded(true);
      setSelectedPinboardId(openPinboardIdBasedOnQueryParam);
      setMaybeOpenPinboardIdBasedOnQueryParam(openPinboardIdBasedOnQueryParam);
    }
  }, []);

  const [selectedPinboardId, setSelectedPinboardId] = useState<string | null>(
    maybeOpenPinboardIdBasedOnQueryParam
  );

  const isDemoSelectedPinboard = selectedPinboardId === demoPinboardData.id;

  const activePinboardIds = isDemoSelectedPinboard
    ? [demoPinboardData.id]
    : Array.from(
        new Set([
          ...(selectedPinboardId ? [selectedPinboardId] : []),
          ...(preselectedPinboardId ? [preselectedPinboardId] : []),
          ...(maybeOpenPinboardIdBasedOnQueryParam
            ? [maybeOpenPinboardIdBasedOnQueryParam]
            : []),
          ...manuallyOpenedPinboardIds?.filter(
            (_) =>
              _ !== preselectedPinboardId &&
              _ !== maybeOpenPinboardIdBasedOnQueryParam
          ),
        ])
      );

  const pinboardDataQuery = useQuery<{
    getPinboardsByIds: PinboardData[];
  }>(gqlGetPinboardsByIds, {
    variables: {
      ids: activePinboardIds.filter((id) => id !== demoPinboardData.id),
    },
  });

  useEffect(() => {
    if (isExpanded && !isDemoSelectedPinboard) {
      pinboardDataQuery.refetch();
      pinboardDataQuery.startPolling(5000);
    } else {
      pinboardDataQuery.stopPolling();
    }
  }, [
    isExpanded,
    ...activePinboardIds, // spread required because useEffect only checks the pointer, not the contents of the activePinboardIds array
  ]);

  const isLoadingActivePinboardList = pinboardDataQuery.loading;

  const activePinboards: PinboardData[] = isDemoSelectedPinboard
    ? [demoPinboardData]
    : pinboardDataQuery.data?.getPinboardsByIds || [];

  const [
    totalItemsReceivedViaSubscription,
    setTotalItemsReceivedViaSubscription,
  ] = useState(0);

  const [allSubscriptionItems, setAllSubscriptionItems] = useState<Item[]>([]);
  const itemSubscription = useSubscription(gqlOnMutateItem, {
    onSubscriptionData: ({ subscriptionData }) => {
      setTotalItemsReceivedViaSubscription((prev) => prev + 1);
      const itemFromSubscription: Item = subscriptionData.data.onMutateItem;
      const pinboardId = itemFromSubscription.pinboardId;
      if (
        activePinboardIds.includes(pinboardId) ||
        pinboardId === maybeInlineSelectedPinboardId
      ) {
        addEmailsToLookup([itemFromSubscription.userEmail]);
        setAllSubscriptionItems((prevState) => [
          ...prevState,
          itemFromSubscription,
        ]);
        if (
          (!isExpanded || selectedPinboardId !== pinboardId) &&
          !itemFromSubscription.editHistory
        ) {
          showNotification(itemFromSubscription);
        }
      }
    },
  });

  const [allSubscriptionClaimedItems, setAllSubscriptionClaimedItems] =
    useState<Item[]>([]);
  const claimSubscription = useSubscription(gqlOnClaimItem, {
    onSubscriptionData: ({ subscriptionData }) => {
      setTotalItemsReceivedViaSubscription((prev) => prev + 1);
      const { updatedItem, newItem }: Claimed =
        subscriptionData.data.onClaimItem;
      const pinboardId = updatedItem.pinboardId;
      if (
        activePinboardIds.includes(pinboardId) ||
        pinboardId === maybeInlineSelectedPinboardId
      ) {
        addEmailsToLookup([newItem.userEmail]);
        setAllSubscriptionClaimedItems((prevState) => [
          ...prevState,
          updatedItem,
          newItem,
        ]);
      }
    },
  });

  const [
    totalOfMyOwnOnSeenItemsReceivedViaSubscription,
    setTotalOfMyOwnOnSeenItemsReceivedViaSubscription,
  ] = useState(0);

  const [allSubscriptionOnSeenItems, setAllSubscriptionOnSeenItems] = useState<
    LastItemSeenByUser[]
  >([]);
  const onSeenItemSubscription = useSubscription(gqlOnSeenItem, {
    onSubscriptionData: ({ subscriptionData }) => {
      const newLastItemSeenByUser: LastItemSeenByUser =
        subscriptionData.data.onSeenItem;
      const pinboardId = newLastItemSeenByUser.pinboardId;
      if (
        activePinboardIds.includes(pinboardId) ||
        pinboardId === maybeInlineSelectedPinboardId
      ) {
        addEmailsToLookup([newLastItemSeenByUser.userEmail]);
        setAllSubscriptionOnSeenItems((prevState) => [
          ...prevState,
          newLastItemSeenByUser,
        ]);
      }
      if (newLastItemSeenByUser.userEmail === userEmail) {
        setTotalOfMyOwnOnSeenItemsReceivedViaSubscription((prev) => prev + 1);
      }
    },
  });

  useEffect(
    () =>
      setError(
        "N/A",
        itemSubscription.error ||
          claimSubscription.error ||
          onSeenItemSubscription.error
      ),
    [
      itemSubscription.error,
      claimSubscription.error,
      onSeenItemSubscription.error,
    ]
  );

  useEffect(
    () =>
      preselectedPinboard &&
      setSelectedPinboardId(
        isPinboardData(preselectedPinboard) ? preselectedPinboard.id : null
      ),
    [preselectedPinboard]
  );

  const clearSelectedPinboard = () => setSelectedPinboardId(null);

  useEffect(() => {
    if (preselectedComposerId) {
      getPreselectedPinboard({
        variables: { composerId: preselectedComposerId },
      });
    }
  }, [preselectedComposerId]);

  const [addManuallyOpenedPinboardIds] = useMutation<{
    addManuallyOpenedPinboardIds: MyUser;
  }>(gqlAddManuallyOpenedPinboardIds);

  const addManuallyOpenedPinboardId =
    (
      isDemo: false // this asks the compiler to ensure we never call this in demo mode
    ) =>
    (pinboardId: string, maybeEmailOverride?: string) =>
      !isDemo &&
      addManuallyOpenedPinboardIds({
        variables: {
          pinboardId,
          maybeEmailOverride,
        },
      });

  const [interTabChannel] = useState<BroadcastChannel>(
    new BroadcastChannel("pinboard-inter-tab-communication")
  );

  useEffect(() => {
    interTabChannel.onmessage = (event) => {
      if (
        event.data.composerId &&
        window.parent.location.href?.includes(
          `content/${event.data.composerId}`
        )
      ) {
        // unfortunately we cannot bring this tab to the fore as browsers prevent it, so we alert to make it easier to find
        alert(
          `This is the composer file you wanted to open from pinboard in tab '${event.data.composerTabTitle}'`
        );
        // reply with acknowledgement
        interTabChannel.postMessage({
          composerIdFocused: event.data.composerId,
          composerTabTitle: window.document.title,
        });
      }
    };
  }, []);

  const openPinboardInNewTab = (pinboardData: PinboardData) => {
    const openInNewTabTimeoutId = setTimeout(() => {
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

      window?.open(composerUrl, "_blank")?.focus();
    }, 500);

    interTabChannel.addEventListener(
      "message",
      (event) => {
        if (event.data.composerIdFocused === pinboardData.composerId) {
          clearTimeout(openInNewTabTimeoutId);
          alert(
            "The composer file you want to see is already open in another tab.\n\n" +
              "You can see an alert message on that tab too to make it easier to find but, unfortunately, you’ll need to select the tab manually."
          );
        }
      },
      { once: true }
    );

    interTabChannel.postMessage({
      composerId: pinboardData.composerId,
      composerTabTitle: window.document.title,
    });
  };

  const openPinboard =
    (isDemo: boolean) =>
    (pinboardData: PinboardData, isOpenInNewTab: boolean) => {
      if (!isDemo && !activePinboardIds.includes(pinboardData.id)) {
        addManuallyOpenedPinboardId(isDemo)(pinboardData.id).then(
          (result) =>
            result.data
              ? updateUserWithChanges(result.data.addManuallyOpenedPinboardIds)
              : console.error(
                  "addManuallyOpenedPinboardIds did not return any data"
                ) // TODO probably report to Sentry
        );
      }

      if (isOpenInNewTab) {
        openPinboardInNewTab(pinboardData);
      } else {
        setSelectedPinboardId(pinboardData.id);
      }
    };

  const [maybeItemIdToHighlight, setMaybeItemIdToHighlight] = useState<
    string | null
  >(null);
  const clearMaybeItemIdToHighlight = () => setMaybeItemIdToHighlight(null);

  const peekAtPinboard = (pinboardId: string, itemIdToHighlight?: string) => {
    setSelectedPinboardId(pinboardId);
    itemIdToHighlight && setMaybeItemIdToHighlight(itemIdToHighlight);
    setIsExpanded(true);
  };

  const [errors, setErrors] = useState<PerPinboard<ApolloError>>({});

  const setError = (pinboardId: string, error: ApolloError | undefined) =>
    setErrors((prevErrors) => ({ ...prevErrors, [pinboardId]: error }));

  const hasError =
    hasApolloAuthError ||
    Object.entries(errors).find(
      ([pinboardId, error]) => activePinboardIds.includes(pinboardId) && error
    ) !== undefined;

  const hasErrorOnOtherPinboard = (pinboardId: string): boolean =>
    hasError &&
    !!Object.entries(errors).find(
      ([otherPinboardId, isError]) => isError && pinboardId !== otherPinboardId
    );

  const [unreadFlags, setUnreadFlags] = useState<PerPinboard<boolean>>({});

  const setUnreadFlag =
    (pinboardId: string) => (unreadFlag: boolean | undefined) => {
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

  const [removeManuallyOpenedPinboardIds] = useMutation<{
    removeManuallyOpenedPinboardIds: MyUser;
  }>(gqlRemoveManuallyOpenedPinboardIds);

  const closePinboard = (pinboardIdToClose: string) => {
    if (maybeOpenPinboardIdBasedOnQueryParam === pinboardIdToClose) {
      setMaybeOpenPinboardIdBasedOnQueryParam(null);
    }
    if (activePinboardIds.includes(pinboardIdToClose)) {
      removeManuallyOpenedPinboardIds({
        variables: { pinboardIdToClose },
      }).then(
        (result) =>
          result.data
            ? updateUserWithChanges(result.data.removeManuallyOpenedPinboardIds)
            : console.error(
                "removeManuallyOpenedPinboardIds did not return any data"
              ) // TODO probably report to Sentry
      );
    }
    setSelectedPinboardId(null);
    setError(pinboardIdToClose, undefined);

    // note that panel.tsx detects this and reinstates any hasUnread from the group pinboards
    setUnreadFlag(pinboardIdToClose)(undefined);
  };

  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (Object.prototype.hasOwnProperty.call(event.data, "item")) {
        const item: Item = event.data.item;
        window.focus();
        setIsExpanded(true);
        if (
          !preselectedPinboardId ||
          preselectedPinboardId === item.pinboardId
        ) {
          setSelectedPinboardId(item.pinboardId); // FIXME handle if said pinboard is not active (i.e. load data)
          // highlighting the item is handled in ScrollableItems component
        }
      }
    });
  }, []);

  const [isRepositioning, setIsRepositioning] = useState<boolean>(false);

  const calculateBoundedPositionTranslation = (
    positionTranslation: ControlPosition
  ) => {
    const isTooFarRight = positionTranslation.x > 0;
    const isTooLow = positionTranslation.y > 0;

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const isTooFarLeft = viewportWidth + positionTranslation.x < floatySize;
    const isTooHigh = viewportHeight + positionTranslation.y < floatySize + top;
    return {
      x: isTooFarLeft
        ? 10 + floatySize - viewportWidth
        : isTooFarRight
        ? -10
        : positionTranslation.x,
      y: isTooHigh
        ? top + floatySize - viewportHeight
        : isTooLow
        ? -10
        : positionTranslation.y,
    };
  };

  const [explicitPositionTranslation, setExplicitPositionTranslationState] =
    useState<ControlPosition>({ x: 0, y: 0 });
  const setExplicitPositionTranslation = (newPosition: ControlPosition) => {
    setExplicitPositionTranslationState(newPosition);
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY_EXPLICIT_POSITION,
      JSON.stringify(newPosition)
    );
  };

  const [boundedPositionTranslation, setBoundedPositionTranslation] =
    useState<ControlPosition>({ x: 0, y: 0 });
  // position translation must be passed in rather than using explicitPositionTranslation to avoid a rerender briefly in the old position
  const updateBoundedPositionTranslation = (
    positionTranslation: ControlPosition
  ) =>
    setBoundedPositionTranslation(
      calculateBoundedPositionTranslation(positionTranslation)
    );

  const resizeCompleteHandler = useCallback(() => {
    updateBoundedPositionTranslation(explicitPositionTranslation);
  }, [isRepositioning]);

  useEffect(() => {
    const savedExplicitPositionTranslation = JSON.parse(
      window.localStorage.getItem(LOCAL_STORAGE_KEY_EXPLICIT_POSITION) ||
        JSON.stringify({ x: 0 - right, y: 0 - bottom })
    );
    setExplicitPositionTranslation(savedExplicitPositionTranslation);
    updateBoundedPositionTranslation(savedExplicitPositionTranslation);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeCompleteHandler);
    return () => window.removeEventListener("resize", resizeCompleteHandler);
  }, [resizeCompleteHandler]);

  const [hasBrowserFocus, setHasBrowserFocus] = useState<boolean>(
    getHasBrowserFocus()
  );
  useEffect(() => {
    const handleVisibilityChange = () => {
      setHasBrowserFocus(getHasBrowserFocus());
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  const clearPayloadToBeSent = () => setPayloadToBeSent(null);

  const contextValue: GlobalStateContextShape = {
    userEmail,
    userLookup,
    addEmailsToLookup,

    activeTab,
    setActiveTab,

    isLoadingActivePinboardList,
    activePinboards,
    activePinboardIds,

    allSubscriptionItems,
    allSubscriptionClaimedItems,
    allSubscriptionOnSeenItems,
    totalItemsReceivedViaSubscription,
    totalOfMyOwnOnSeenItemsReceivedViaSubscription,

    payloadToBeSent,
    setPayloadToBeSent,
    clearPayloadToBeSent,

    addManuallyOpenedPinboardId,
    openPinboard,
    openPinboardInNewTab,
    peekAtPinboard,
    closePinboard,
    preselectedPinboard,
    cropsOnPreselectedPinboard,
    setCropsOnPreselectedPinboard,
    selectedPinboardId,
    clearSelectedPinboard,

    openInTool,

    maybeItemIdToHighlight,
    clearMaybeItemIdToHighlight,

    hasEverUsedTour,
    visitTourStep,

    featureFlags,

    showNotification,
    hasWebPushSubscription,

    errors,
    hasError,
    setError,
    hasErrorOnOtherPinboard,

    hasBrowserFocus,
    isExpanded,
    setIsExpanded,

    unreadFlags,
    hasUnread,
    setUnreadFlag,
    hasUnreadOnOtherPinboard,

    presetUnreadNotificationCount,

    isRepositioning,
    setIsRepositioning,

    explicitPositionTranslation,
    setExplicitPositionTranslation,
    boundedPositionTranslation,
    updateBoundedPositionTranslation,
  };

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};
