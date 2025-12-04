import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import root from "react-shadow/emotion";
import { PayloadAndType } from "./types/PayloadAndType";
import {
  AddToPinboardButtonPortal,
  ASSET_HANDLE_HTML_TAG,
} from "./addToPinboardButton";
import {
  ApolloClient,
  ApolloProvider,
  ReactiveVar,
  useMutation,
  useQuery,
  useReactiveVar,
  useSubscription,
} from "@apollo/client";
import {
  gqlVisitTourStep,
  gqlGetMyUser,
  gqlGetUsers,
  gqlOnMyUserChanges,
  gqlSetWebPushSubscriptionForUser,
} from "../gql";
import { Item, MyUser, User } from "shared/graphql/graphql";
import { ItemWithParsedPayload } from "./types/ItemWithParsedPayload";
import { HiddenIFrameForServiceWorker } from "./pushNotificationPreferences";
import { GlobalStateProvider } from "./globalState";
import { Floaty } from "./floaty";
import { Panel } from "./panel";
import { convertGridDragEventToPayload, isGridDragEvent } from "./drop";
import { TickContext } from "./formattedDateTime";
import {
  IPinboardEventTags,
  PINBOARD_TELEMETRY_TYPE,
  TelemetryContext,
} from "./types/Telemetry";
import { IUserTelemetryEvent } from "@guardian/user-telemetry-client";
import { UserLookup } from "./types/UserLookup";
import {
  InlineMode,
  isInlineMode,
  WORKFLOW_PINBOARD_ELEMENTS_QUERY_SELECTOR,
} from "./inline/inlineMode";
import { getAgateFontFaceIfApplicable } from "../fontNormaliser";
import { Global } from "@emotion/react";
import { TourStateProvider } from "./tour/tourState";
import { demoMentionableUsers, demoUser } from "./tour/tourConstants";
import {
  consumeFeatureFlagQueryParamsAndUpdateAccordingly,
  extractFeatureFlags,
} from "./featureFlags";
import {
  FRONTS_PINBOARD_ELEMENTS_QUERY_SELECTOR,
  FrontsIntegration,
} from "./fronts/frontsIntegration";
import {
  SUGGEST_ALTERNATE_CROP_QUERY_SELECTOR,
  SuggestAlternateCrops,
} from "./fronts/suggestAlternateCrops";
import { MaybeInvalidPushNotificationPopup } from "./maybeInvalidPushSubscriptionPopup";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESET_UNREAD_NOTIFICATIONS_COUNT_HTML_TAG = "pinboard-bubble-preset";

interface PinBoardAppProps {
  apolloClient: ApolloClient<Record<string, unknown>>;
  hasApolloAuthErrorVar: ReactiveVar<boolean>;
  userEmail: string;
  permissions: string[];
}

export const PinBoardApp = ({
  apolloClient,
  hasApolloAuthErrorVar,
  userEmail,
  permissions,
}: PinBoardAppProps) => {
  const [payloadToBeSent, setPayloadToBeSent] = useState<PayloadAndType | null>(
    null
  );
  const [assetHandles, setAssetHandles] = useState<HTMLElement[]>([]);
  const [workflowPinboardElements, setWorkflowPinboardElements] = useState<
    HTMLElement[]
  >([]);
  const [frontsPinboardElements, setFrontsPinboardElements] = useState<
    HTMLElement[]
  >([]);
  const [alternateCropSuggestionElements, setAlternateCropSuggestionElements] =
    useState<HTMLElement[]>([]);

  const [maybeInlineSelectedPinboardId, _setMaybeInlineSelectedPinboardId] =
    useState<string | null>(null);
  const setMaybeInlineSelectedPinboardId = (pinboardId: string | null) => {
    _setMaybeInlineSelectedPinboardId(null); // trigger unmount first
    setTimeout(() => _setMaybeInlineSelectedPinboardId(pinboardId), 1);
  };

  const [preSelectedComposerId, setPreselectedComposerId] = useState<
    string | null | undefined
  >(null);

  const [composerSection, setComposerSection] = useState<string | undefined>();

  const [openInTool, setOpenInTool] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const refreshAssetHandleNodes = () =>
    setAssetHandles(
      Array.from(document.querySelectorAll(ASSET_HANDLE_HTML_TAG))
    );

  const refreshWorkflowPinboardElements = () =>
    setWorkflowPinboardElements(
      Array.from(
        document.querySelectorAll(WORKFLOW_PINBOARD_ELEMENTS_QUERY_SELECTOR)
      )
    );

  const refreshFrontsPinboardElements = () =>
    setFrontsPinboardElements(
      Array.from(
        document.querySelectorAll(FRONTS_PINBOARD_ELEMENTS_QUERY_SELECTOR)
      )
    );

  const refreshAlternateCropSuggestionElements = () =>
    setAlternateCropSuggestionElements(
      Array.from(
        document.querySelectorAll(SUGGEST_ALTERNATE_CROP_QUERY_SELECTOR)
      )
    );

  const refreshPreselectedPinboard = () => {
    const preselectPinboardHTMLElement: HTMLElement | null =
      document.querySelector(PRESELECT_PINBOARD_HTML_TAG);
    const newComposerId = preselectPinboardHTMLElement?.dataset?.composerId;
    newComposerId !== preSelectedComposerId &&
      setPreselectedComposerId(newComposerId);

    const newComposerSection =
      preselectPinboardHTMLElement?.dataset?.composerSection;
    newComposerSection !== composerSection &&
      setComposerSection(newComposerSection);

    const newOpenInTool = preselectPinboardHTMLElement?.dataset?.tool;
    if (newOpenInTool !== undefined && newOpenInTool !== openInTool)
      setOpenInTool(newOpenInTool);
  };

  const [presetUnreadNotificationCount, setPresetUnreadNotificationCount] =
    useState<number | undefined>();
  const refreshPresetUnreadNotifications = () => {
    const rawCount = (
      document.querySelector(
        PRESET_UNREAD_NOTIFICATIONS_COUNT_HTML_TAG
      ) as HTMLElement
    )?.dataset?.count;

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
    refreshWorkflowPinboardElements();
    refreshFrontsPinboardElements();
    refreshAlternateCropSuggestionElements();

    refreshPreselectedPinboard();

    refreshPresetUnreadNotifications();

    // begin watching for any DOM changes
    new MutationObserver(() => {
      refreshAssetHandleNodes();
      refreshWorkflowPinboardElements();
      refreshFrontsPinboardElements();
      refreshAlternateCropSuggestionElements();
      refreshPreselectedPinboard();
      refreshPresetUnreadNotifications();
    }).observe(document.body, {
      characterData: false,
      childList: true,
      subtree: true,
      characterDataOldValue: false,
      attributes: true,
      attributeOldValue: false,
      attributeFilter: [
        "data-composer-id",
        "data-composer-section",
        "data-working-title",
        "data-headline",
      ],
    });
  }, []);

  const [userLookup, setUserLookup] = useState<UserLookup>(
    // FIXME really not sure we should be doing this unless we're in the tour
    demoMentionableUsers.reduce(
      (acc, user) => ({ ...acc, [user.email]: user }),
      { [demoUser.email]: demoUser }
    )
  );

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
  const updateUserWithChanges = (newMyUser: MyUser) => {
    meQuery.updateQuery(() => ({ getMyUser: newMyUser }));
  };

  const visitTourStep = (tourStepId: string) =>
    apolloClient
      .mutate<{
        visitTourStep: MyUser;
      }>({
        mutation: gqlVisitTourStep,
        variables: {
          tourStepId,
        },
      })
      .then(({ data }) => {
        data?.visitTourStep &&
          meQuery.updateQuery(() => ({ getMyUser: data.visitTourStep }));
      });

  useSubscription<{ onMyUserChanges: MyUser }>(gqlOnMyUserChanges(userEmail), {
    client: apolloClient,
    onSubscriptionData: ({ subscriptionData }) => {
      subscriptionData.data &&
        updateUserWithChanges(subscriptionData.data?.onMyUserChanges);
    },
  });

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
      setTimeout(
        () =>
          serviceWorkerIFrameRef.current?.contentWindow?.postMessage(
            {
              item: {
                ...item,
                payload: item.payload && JSON.parse(item.payload),
              } as ItemWithParsedPayload,
            },
            "*"
          ),
        500
      );
    }
  };

  const clearDesktopNotificationsForPinboardId = (pinboardId: string) => {
    setTimeout(
      () =>
        serviceWorkerIFrameRef.current?.contentWindow?.postMessage(
          {
            clearNotificationsForPinboardId: pinboardId,
          },
          "*"
        ),
      1000
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
    basicSendTelemetryEvent?.(
      type,
      { hostname: window.location.hostname, ...newTags },
      value
    );
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

  const hasApolloAuthError = useReactiveVar(hasApolloAuthErrorVar);

  const featureFlags = useMemo(
    () => extractFeatureFlags(me?.featureFlags),
    [me?.featureFlags]
  );
  useEffect(() => {
    console.log("Pinboard running", { featureFlags });

    me?.email &&
      consumeFeatureFlagQueryParamsAndUpdateAccordingly(apolloClient);
  }, [me]);

  return (
    <TelemetryContext.Provider value={sendTelemetryEvent}>
      <ApolloProvider client={apolloClient}>
        <GlobalStateProvider
          hasApolloAuthError={hasApolloAuthError}
          presetUnreadNotificationCount={presetUnreadNotificationCount}
          userEmail={userEmail}
          permissions={permissions}
          preselectedComposerId={preSelectedComposerId}
          openInTool={openInTool}
          payloadToBeSent={payloadToBeSent}
          setPayloadToBeSent={setPayloadToBeSent}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          userLookup={userLookup}
          addEmailsToLookup={addEmailsToLookup}
          hasWebPushSubscription={hasWebPushSubscription}
          manuallyOpenedPinboardIds={manuallyOpenedPinboardIds || []}
          updateUserWithChanges={updateUserWithChanges}
          showNotification={showDesktopNotification}
          clearDesktopNotificationsForPinboardId={
            clearDesktopNotificationsForPinboardId
          }
          hasEverUsedTour={me?.hasEverUsedTour}
          visitTourStep={visitTourStep}
          featureFlags={featureFlags}
          maybeInlineSelectedPinboardId={maybeInlineSelectedPinboardId}
        >
          <TourStateProvider>
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
                    sendTelemetryEvent?.(
                      PINBOARD_TELEMETRY_TYPE.DRAG_AND_DROP,
                      {
                        assetType: payload.type,
                      }
                    );
                }
                setIsDropTarget(false);
              }}
            >
              <TickContext.Provider value={lastTickTimestamp}>
                <Floaty isDropTarget={isDropTarget} />
                <Panel
                  isDropTarget={isDropTarget}
                  workflowPinboardElements={workflowPinboardElements}
                  setMaybeInlineSelectedPinboardId={
                    setMaybeInlineSelectedPinboardId
                  }
                />
                {useMemo(isInlineMode, []) && (
                  <InlineMode
                    workflowPinboardElements={workflowPinboardElements}
                    maybeInlineSelectedPinboardId={
                      maybeInlineSelectedPinboardId
                    }
                    setMaybeInlineSelectedPinboardId={
                      setMaybeInlineSelectedPinboardId
                    }
                  />
                )}
              </TickContext.Provider>
            </root.div>
            {frontsPinboardElements.length > 0 && (
              <FrontsIntegration
                frontsPinboardElements={frontsPinboardElements}
              />
            )}
            {alternateCropSuggestionElements.length > 0 && (
              <SuggestAlternateCrops
                alternateCropSuggestionElements={
                  alternateCropSuggestionElements
                }
              />
            )}
            {assetHandles.map((node, index) => (
              <AddToPinboardButtonPortal
                key={index}
                node={node}
                setPayloadToBeSent={setPayloadToBeSent}
                expand={() => setIsExpanded(true)}
              />
            ))}
          </TourStateProvider>
          <MaybeInvalidPushNotificationPopup me={me} />
        </GlobalStateProvider>
      </ApolloProvider>
    </TelemetryContext.Provider>
  );
};
