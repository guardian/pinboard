import {
  ApolloError,
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Item, MyUser } from "../../shared/graphql/graphql";
import {
  gqlAddCompletedTourStep,
  gqlAddManuallyOpenedPinboardIds,
  gqlGetPinboardByComposerId,
  gqlGetPinboardsByIds,
  gqlRemoveManuallyOpenedPinboardIds,
} from "../gql";
import type { PayloadAndType } from "./types/PayloadAndType";
import type { PerPinboard } from "./types/PerPinboard";
import type { PinboardData } from "../../shared/graphql/extraTypes";
import { isPinboardData } from "../../shared/graphql/extraTypes";
import type { PreselectedPinboard } from "../../shared/graphql/extraTypes";
import { ChatTab, Tab } from "./types/Tab";
import { ControlPosition } from "react-draggable";
import { bottom, top, floatySize, right } from "./styling";
import { EXPAND_PINBOARD_QUERY_PARAM } from "../../shared/constants";
import { UserLookup } from "./types/UserLookup";
import { demoPinboardData } from "./tour/tourConstants";
import { TourStepID } from "./tour/tourStepMap";

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

  payloadToBeSent: PayloadAndType | null;
  setPayloadToBeSent: (newPayloadToBeSent: PayloadAndType | null) => void;
  clearPayloadToBeSent: () => void;

  addManuallyOpenedPinboardId: (
    isDemo: false // this asks the compiler to ensure we never call this in demo mode
  ) => (pinboardId: string, maybeEmailOverride?: string) => void;
  openPinboard: (
    isDemo: boolean
  ) => (pinboardData: PinboardData, isOpenInNewTab: boolean) => void;
  openPinboardInNewTab: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  preselectedPinboard: PreselectedPinboard;
  selectedPinboardId: string | null | undefined;
  clearSelectedPinboard: () => void;

  addCompletedTourStep: (tourStepId: string) => void;

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
  openPinboardIdBasedOnQueryParam: string | null;
  preselectedComposerId: string | null | undefined;
  payloadToBeSent: PayloadAndType | null;
  setPayloadToBeSent: (newPayloadToBeSent: PayloadAndType | null) => void;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  userLookup: UserLookup;
  addEmailsToLookup: (emails: string[]) => void;
  hasWebPushSubscription: boolean | null | undefined;
  manuallyOpenedPinboardIds: string[];
  setManuallyOpenedPinboardIds: (newMyUser: MyUser) => void;
  showNotification: (item: Item) => void;
  clearDesktopNotificationsForPinboardId: (pinboardId: string) => void;
  presetUnreadNotificationCount: number | undefined;
}
export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({
  hasApolloAuthError,
  userEmail,
  openPinboardIdBasedOnQueryParam,
  preselectedComposerId,
  presetUnreadNotificationCount,
  payloadToBeSent,
  setPayloadToBeSent,
  isExpanded,
  setIsExpanded,
  userLookup,
  addEmailsToLookup,
  hasWebPushSubscription,
  manuallyOpenedPinboardIds,
  setManuallyOpenedPinboardIds,
  showNotification,
  clearDesktopNotificationsForPinboardId,
  children,
}) => {
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

  const [selectedPinboardId, setSelectedPinboardId] = useState<string | null>(
    openPinboardIdBasedOnQueryParam
  );

  const isDemoSelectedPinboard = selectedPinboardId === demoPinboardData.id;

  const activePinboardIds = isDemoSelectedPinboard
    ? [demoPinboardData.id]
    : [
        ...(preselectedPinboardId ? [preselectedPinboardId] : []),
        ...(openPinboardIdBasedOnQueryParam
          ? [openPinboardIdBasedOnQueryParam]
          : []),
        ...manuallyOpenedPinboardIds?.filter(
          (_) =>
            _ !== preselectedPinboardId && _ !== openPinboardIdBasedOnQueryParam
        ),
      ];

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

  const apolloClient = useApolloClient();

  const addCompletedTourStep = (tourStepId: string) =>
    apolloClient.mutate<{
      addCompletedTourStep: MyUser;
    }>({
      mutation: gqlAddCompletedTourStep,
      variables: {
        tourStepId,
      },
    }); // TODO - set myUser based on response

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
              ? setManuallyOpenedPinboardIds(
                  result.data.addManuallyOpenedPinboardIds
                )
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
    if (activePinboardIds.includes(pinboardIdToClose)) {
      removeManuallyOpenedPinboardIds({
        variables: { pinboardIdToClose },
      }).then(
        (result) =>
          result.data
            ? setManuallyOpenedPinboardIds(
                result.data.removeManuallyOpenedPinboardIds
              )
            : console.error(
                "removeManuallyOpenedPinboardIds did not return any data"
              ) // TODO probably report to Sentry
      );
    }
    setSelectedPinboardId(null);
    setUnreadFlag(pinboardIdToClose)(undefined);
    setError(pinboardIdToClose, undefined);
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

    payloadToBeSent,
    setPayloadToBeSent,
    clearPayloadToBeSent,

    addManuallyOpenedPinboardId,
    openPinboard,
    openPinboardInNewTab,
    closePinboard,
    preselectedPinboard,
    selectedPinboardId,
    clearSelectedPinboard,

    addCompletedTourStep,

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
