import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import root from "react-shadow/emotion";
import { PayloadAndType } from "./types/PayloadAndType";
import {
  ASSET_HANDLE_HTML_TAG,
  AddToPinboardButtonPortal,
} from "./addToPinboardButton";
import {
  ApolloClient,
  ApolloProvider,
  useMutation,
  useQuery,
  useSubscription,
} from "@apollo/client";
import {
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
import {
  EXPAND_PINBOARD_QUERY_PARAM,
  OPEN_PINBOARD_QUERY_PARAM,
} from "../../shared/constants";
import { UserLookup } from "./types/UserLookup";
import { gqlGetUsers } from "../gql";
import { InlineMode, WORKFLOW_TITLE_QUERY_SELECTOR } from "./inlineMode";
import { getAgateFontFaceIfApplicable } from "../fontNormaliser";
import { Global } from "@emotion/react";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESET_UNREAD_NOTIFICATIONS_COUNT_HTML_TAG = "pinboard-bubble-preset";

interface PinBoardAppProps {
  apolloClient: ApolloClient<Record<string, unknown>>;
  userEmail: string;
}

export const PinBoardApp = ({ apolloClient, userEmail }: PinBoardAppProps) => {
  const isInlineMode = useMemo(
    () => window.location.hostname.startsWith("workflow."),
    []
  );

  const [payloadToBeSent, setPayloadToBeSent] = useState<PayloadAndType | null>(
    null
  );
  const clearPayloadToBeSent = () => setPayloadToBeSent(null);

  const [assetHandles, setAssetHandles] = useState<HTMLElement[]>([]);
  const [workflowTitleElements, setWorkflowTitleElements] = useState<
    HTMLElement[]
  >([]);

  const queryParams = new URLSearchParams(window.location.search);
  // using state here but without setter, because host application/SPA might change url
  // and lose the query param, but we don't want to lose the preselection
  const [openPinboardIdBasedOnQueryParam] = useState(
    queryParams.get(OPEN_PINBOARD_QUERY_PARAM)
  );

  const [preSelectedComposerId, setPreselectedComposerId] = useState<
    string | null | undefined
  >(null);

  const [composerSection, setComposerSection] = useState<string | undefined>();

  const [isExpanded, setIsExpanded] = useState<boolean>(
    !!openPinboardIdBasedOnQueryParam || // expand by default when preselected via url query param
      queryParams.get(EXPAND_PINBOARD_QUERY_PARAM)?.toLowerCase() === "true"
  );
  const expandFloaty = () => setIsExpanded(true);

  const refreshAssetHandleNodes = () =>
    setAssetHandles(
      Array.from(document.querySelectorAll(ASSET_HANDLE_HTML_TAG))
    );

  const refreshWorkflowTitleElements = () =>
    setWorkflowTitleElements(
      Array.from(document.querySelectorAll(WORKFLOW_TITLE_QUERY_SELECTOR))
    );

  const refreshPreselectedPinboard = () => {
    const preselectPinboardHTMLElement: HTMLElement | null = document.querySelector(
      PRESELECT_PINBOARD_HTML_TAG
    );
    const newComposerId = preselectPinboardHTMLElement?.dataset?.composerId;
    newComposerId !== preSelectedComposerId &&
      setPreselectedComposerId(newComposerId);

    const newComposerSection =
      preselectPinboardHTMLElement?.dataset?.composerSection;
    newComposerSection !== composerSection &&
      setComposerSection(newComposerSection);
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
    refreshAssetHandleNodes();
    refreshWorkflowTitleElements();

    refreshPreselectedPinboard();

    refreshPresetUnreadNotifications();

    // begin watching for any DOM changes
    new MutationObserver(() => {
      refreshAssetHandleNodes();
      refreshWorkflowTitleElements();
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

  const [userLookup, setUserLookup] = useState<UserLookup>({});
  const [userEmailsToLookup, setEmailsToLookup] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const newUsersToLookup = Array.from(userEmailsToLookup).filter(
      (email) => !userLookup[email]
    );
    if (newUsersToLookup.length > 0) {
      apolloClient
        .query({
          query: gqlGetUsers,
          variables: { emails: newUsersToLookup },
        })
        .then(({ data }) => {
          setUserLookup((existingUserLookup) =>
            data.getUsers.reduce(
              (acc: UserLookup, user: User) => ({
                ...acc,
                [user.email]: user,
              }),
              existingUserLookup
            )
          );
        });
    }
  }, [userEmailsToLookup]);

  const addEmailsToLookup = (emails: string[]) => {
    setEmailsToLookup(
      (existingEmails) => new Set([...existingEmails, ...emails])
    );
  };

  const meQuery = useQuery<{ getMyUser: MyUser }>(gqlGetMyUser, {
    client: apolloClient,
    onCompleted: ({ getMyUser }) => addEmailsToLookup([getMyUser.email]),
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

  const agateFontFaceIfApplicable = useMemo(getAgateFontFaceIfApplicable, []);

  return (
    <TelemetryContext.Provider value={sendTelemetryEvent}>
      <ApolloProvider client={apolloClient}>
        <Global styles={agateFontFaceIfApplicable} />
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
            openPinboardIdBasedOnQueryParam={openPinboardIdBasedOnQueryParam}
            preselectedComposerId={preSelectedComposerId}
            payloadToBeSent={payloadToBeSent}
            clearPayloadToBeSent={clearPayloadToBeSent}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            userLookup={userLookup}
            addEmailsToLookup={addEmailsToLookup}
            hasWebPushSubscription={hasWebPushSubscription}
            manuallyOpenedPinboardIds={manuallyOpenedPinboardIds || []}
            setManuallyOpenedPinboardIds={setManuallyOpenedPinboardIds}
            showNotification={showDesktopNotification}
            clearDesktopNotificationsForPinboardId={
              clearDesktopNotificationsForPinboardId
            }
          >
            <TickContext.Provider value={lastTickTimestamp}>
              {isInlineMode ? (
                <InlineMode workflowTitleElements={workflowTitleElements} />
              ) : (
                <React.Fragment>
                  <Floaty isDropTarget={isDropTarget} />
                  <Panel isDropTarget={isDropTarget} />
                </React.Fragment>
              )}
            </TickContext.Provider>
          </GlobalStateProvider>
        </root.div>
        {assetHandles.map((node, index) => (
          <AddToPinboardButtonPortal
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
