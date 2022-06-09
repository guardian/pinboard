import React, { useContext, useEffect, useRef, useState } from "react";
import root from "react-shadow/emotion";
import { PayloadAndType } from "./types/PayloadAndType";
import { ASSET_HANDLE_HTML_TAG, ButtonPortal } from "./addToPinboardButton";
import {
  ApolloClient,
  ApolloProvider,
  useMutation,
  useQuery,
  useSubscription,
} from "@apollo/client";
import {
  gqlGetAllUsers,
  gqlGetMyUser,
  gqlOnManuallyOpenedPinboardIdsChanged,
  gqlSetWebPushSubscriptionForUser,
} from "../gql";
import { Item, MyUser, User } from "../../shared/graphql/graphql";
import { ItemWithParsedPayload } from "./types/ItemWithParsedPayload";
import {
  desktopNotificationsPreferencesUrl,
  HiddenIFrameForServiceWorker,
} from "./pushNotificationPreferences";
import { GlobalStateProvider } from "./globalState";
import { Floaty } from "./floaty";
import { Panel } from "./panel";
import { convertGridDragEventToPayload, isGridDragEvent } from "./drop";
import { TickContext } from "./formattedDateTime";
import {
  TelemetryContext,
  PINBOARD_TELEMETRY_TYPE,
  IPinboardEventTags,
} from "./types/Telemetry";
import { IUserTelemetryEvent } from "@guardian/user-telemetry-client";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESELECT_PINBOARD_QUERY_PARAM = "pinboardComposerID";
const PRESET_UNREAD_NOTIFICATIONS_COUNT_HTML_TAG = "pinboard-bubble-preset";
export const EXPAND_PINBOARD_QUERY_PARAM = "expandPinboard";

interface PinBoardAppProps {
  apolloClient: ApolloClient<Record<string, unknown>>;
  userEmail: string;
}

export const PinBoardApp = ({ apolloClient, userEmail }: PinBoardAppProps) => {
  const [payloadToBeSent, setPayloadToBeSent] = useState<PayloadAndType | null>(
    null
  );
  const clearPayloadToBeSent = () => setPayloadToBeSent(null);

  const [buttonNodes, setButtonNodes] = useState<HTMLElement[]>([]);

  const queryParams = new URLSearchParams(window.location.search);
  // using state here but without setter, because host application/SPA might change url
  // and lose the query param but we don't want to lose the preselection
  const [preSelectedComposerIdFromQueryParam] = useState(
    queryParams.get(PRESELECT_PINBOARD_QUERY_PARAM)
  );

  const [preSelectedComposerId, setPreselectedComposerId] = useState<
    string | null | undefined
  >(preSelectedComposerIdFromQueryParam);

  const [composerSection, setComposerSection] = useState<string | undefined>();

  const [isExpanded, setIsExpanded] = useState<boolean>(
    !!preSelectedComposerIdFromQueryParam || // expand by default when preselected via url query param
      queryParams.get(EXPAND_PINBOARD_QUERY_PARAM)?.toLowerCase() === "true"
  );
  const expandFloaty = () => setIsExpanded(true);

  const refreshButtonNodes = () =>
    setButtonNodes(
      Array.from(document.querySelectorAll(ASSET_HANDLE_HTML_TAG))
    );

  const refreshPreselectedPinboard = () => {
    if (preSelectedComposerIdFromQueryParam) {
      setPreselectedComposerId(preSelectedComposerIdFromQueryParam);
    } else {
      const preselectPinboardHTMLElement: HTMLElement | null = document.querySelector(
        PRESELECT_PINBOARD_HTML_TAG
      );
      if (preselectPinboardHTMLElement) {
        setPreselectedComposerId(
          preselectPinboardHTMLElement.dataset?.composerId
        );
        setComposerSection(
          preselectPinboardHTMLElement.dataset?.composerSection
        );
      }
    }
  };

  const [
    presetUnreadNotificationCount,
    setPresetUnreadNotificationCount,
  ] = useState<number | undefined>();
  const refreshPresetUnreadNotifications = () => {
    const rawCount = (document.querySelector(
      PRESET_UNREAD_NOTIFICATIONS_COUNT_HTML_TAG
    ) as HTMLElement)?.dataset?.count;

    if (rawCount !== undefined) {
      const count = parseInt(rawCount);
      setPresetUnreadNotificationCount(isNaN(count) ? 0 : count);
    } else {
      setPresetUnreadNotificationCount(undefined);
    }
  };

  useEffect(() => {
    // Add nodes that already exist at time React app is instantiated
    refreshButtonNodes();

    refreshPreselectedPinboard();

    refreshPresetUnreadNotifications();

    // begin watching for any DOM changes
    new MutationObserver(() => {
      refreshButtonNodes();
      refreshPreselectedPinboard();
      refreshPresetUnreadNotifications();
    }).observe(document.body, {
      attributes: false,
      characterData: false,
      childList: true,
      subtree: true,
      attributeOldValue: false,
      characterDataOldValue: false,
    });
  }, []);

  const meQuery = useQuery<{ getMyUser: MyUser }>(gqlGetMyUser, {
    client: apolloClient,
  });

  const me = meQuery.data?.getMyUser;

  const manuallyOpenedPinboardIds = me?.manuallyOpenedPinboardIds;
  const setManuallyOpenedPinboardIds = (newMyUser: MyUser) => {
    meQuery.updateQuery(() => ({ getMyUser: newMyUser }));
  };

  useSubscription<{ onManuallyOpenedPinboardIdsChanged: MyUser }>(
    gqlOnManuallyOpenedPinboardIdsChanged(userEmail),
    {
      client: apolloClient,
      onSubscriptionData: ({ subscriptionData }) => {
        subscriptionData.data &&
          setManuallyOpenedPinboardIds(
            subscriptionData.data?.onManuallyOpenedPinboardIdsChanged
          );
      },
    }
  );

  const rawHasWebPushSubscription = me?.hasWebPushSubscription;

  const [hasWebPushSubscription, setHasWebPushSubscription] = useState<
    boolean | null | undefined
  >(rawHasWebPushSubscription);

  useEffect(() => {
    setHasWebPushSubscription(rawHasWebPushSubscription);
  }, [rawHasWebPushSubscription]);

  const usersQuery = useQuery(gqlGetAllUsers, { client: apolloClient });
  //TODO: make use of usersQuery.error and usersQuery.loading

  const allUsers: User[] | undefined = usersQuery.data?.listUsers.items;

  const userLookup = allUsers?.reduce(
    (lookup, user) => ({
      ...lookup,
      [user.email]: user,
    }),
    {} as { [email: string]: User }
  );

  const [setWebPushSubscriptionForUser] = useMutation<{
    setWebPushSubscriptionForUser: MyUser;
  }>(gqlSetWebPushSubscriptionForUser, {
    client: apolloClient,
    onCompleted: ({
      setWebPushSubscriptionForUser: { hasWebPushSubscription },
    }) => setHasWebPushSubscription(hasWebPushSubscription),
    onError: (error) => {
      const message = "Could not subscribe to desktop notifications";
      alert(message);
      console.error(message, error);
    },
  });

  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (
        event.source !== window &&
        Object.prototype.hasOwnProperty.call(event.data, "webPushSubscription")
      ) {
        setWebPushSubscriptionForUser({
          variables: {
            webPushSubscription: event.data.webPushSubscription,
          },
        });
      }
    });
  }, []);

  const serviceWorkerIFrameRef = useRef<HTMLIFrameElement>(null);

  const showDesktopNotification = (item?: Item) => {
    if (item && item.userEmail !== userEmail) {
      serviceWorkerIFrameRef.current?.contentWindow?.postMessage(
        {
          item: {
            ...item,
            payload: item.payload && JSON.parse(item.payload),
          } as ItemWithParsedPayload,
        },
        desktopNotificationsPreferencesUrl
      );
    }
  };

  const clearDesktopNotificationsForPinboardId = (pinboardId: string) => {
    serviceWorkerIFrameRef.current?.contentWindow?.postMessage(
      {
        clearNotificationsForPinboardId: pinboardId,
      },
      desktopNotificationsPreferencesUrl
    );
  };

  const [lastTickTimestamp, setLastTickTimestamp] = useState<number>(
    Date.now()
  );
  useEffect(() => {
    const intervalHandle = setInterval(
      () => setLastTickTimestamp(Date.now()),
      60 * 1000
    );
    return () => clearInterval(intervalHandle);
  }, []);

  const [isDropTarget, setIsDropTarget] = useState<boolean>(false);

  const basicSendTelemetryEvent = useContext(TelemetryContext);

  const sendTelemetryEvent = (
    type: PINBOARD_TELEMETRY_TYPE,
    tags?: IUserTelemetryEvent["tags"] & IPinboardEventTags,
    value: boolean | number = true
  ) => {
    const newTags =
      preSelectedComposerId && composerSection
        ? {
            composerId: preSelectedComposerId,
            composerSection,
            ...(tags || {}),
          }
        : tags;
    basicSendTelemetryEvent?.(type, newTags, value);
  };

  useEffect(() => {
    sendTelemetryEvent?.(
      PINBOARD_TELEMETRY_TYPE.PINBOARD_LOADED,
      preSelectedComposerId && composerSection
        ? {
            composerId: preSelectedComposerId,
            composerSection: composerSection,
          }
        : {}
    );
  }, [preSelectedComposerId, composerSection]);

  return (
    <TelemetryContext.Provider value={sendTelemetryEvent}>
      <ApolloProvider client={apolloClient}>
        <HiddenIFrameForServiceWorker iFrameRef={serviceWorkerIFrameRef} />
        <root.div
          onDragOver={(event) =>
            isGridDragEvent(event) && event.preventDefault()
          }
          onDragEnter={(event) => {
            if (isGridDragEvent(event)) {
              event.preventDefault();
              setIsDropTarget(true);
            }
          }}
          onDragLeave={() => setIsDropTarget(false)}
          onDragEnd={() => setIsDropTarget(false)}
          onDragExit={() => setIsDropTarget(false)}
          onDrop={(event) => {
            if (isGridDragEvent(event)) {
              event.preventDefault();
              const payload = convertGridDragEventToPayload(event);
              setPayloadToBeSent(payload);
              setIsExpanded(true);
              payload &&
                sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.DRAG_AND_DROP, {
                  assetType: payload.type,
                });
            }
            setIsDropTarget(false);
          }}
        >
          <GlobalStateProvider
            presetUnreadNotificationCount={presetUnreadNotificationCount}
            userEmail={userEmail}
            preselectedComposerId={preSelectedComposerId}
            payloadToBeSent={payloadToBeSent}
            clearPayloadToBeSent={clearPayloadToBeSent}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            userLookup={userLookup}
            hasWebPushSubscription={hasWebPushSubscription}
            manuallyOpenedPinboardIds={manuallyOpenedPinboardIds || []}
            setManuallyOpenedPinboardIds={setManuallyOpenedPinboardIds}
            showNotification={showDesktopNotification}
            clearDesktopNotificationsForPinboardId={
              clearDesktopNotificationsForPinboardId
            }
          >
            <TickContext.Provider value={lastTickTimestamp}>
              <Floaty isDropTarget={isDropTarget} />
              <Panel isDropTarget={isDropTarget} />
            </TickContext.Provider>
          </GlobalStateProvider>
        </root.div>
        {buttonNodes.map((node, index) => (
          <ButtonPortal
            key={index}
            node={node}
            setPayloadToBeSent={setPayloadToBeSent}
            expand={expandFloaty}
          />
        ))}
      </ApolloProvider>
    </TelemetryContext.Provider>
  );
};
