import React, { useEffect, useRef, useState } from "react";
import { PayloadAndType } from "./types/PayloadAndType";
import { ASSET_HANDLE_HTML_TAG, ButtonPortal } from "./addToPinboardButton";
import {
  ApolloClient,
  ApolloProvider,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  gqlGetAllUsers,
  gqlGetMyUser,
  gqlSetWebPushSubscriptionForUser,
} from "../gql";
import {
  Item,
  User,
  UserWithHasWebPushSubscription,
} from "../../shared/graphql/graphql";
import { ItemWithParsedPayload } from "./types/ItemWithParsedPayload";
import {
  desktopNotificationsPreferencesUrl,
  HiddenIFrameForServiceWorker,
} from "./pushNotificationPreferences";
import { Floaty } from "./floaty";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESELECT_PINBOARD_QUERY_PARAM = "pinboardComposerID";
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

  const [isExpanded, setIsExpanded] = useState<boolean>(
    !!preSelectedComposerIdFromQueryParam || // expand by default when preselected via url query param
      queryParams.get(EXPAND_PINBOARD_QUERY_PARAM)?.toLowerCase() === "true"
  );
  const expandFloaty = () => setIsExpanded(true);

  const refreshButtonNodes = () =>
    setButtonNodes(
      Array.from(document.querySelectorAll(ASSET_HANDLE_HTML_TAG))
    );

  const refreshPreselectedPinboard = () =>
    setPreselectedComposerId(
      preSelectedComposerIdFromQueryParam ||
        (document.querySelector(PRESELECT_PINBOARD_HTML_TAG) as HTMLElement)
          ?.dataset?.composerId
    );

  useEffect(() => {
    // Add nodes that already exist at time React app is instantiated
    refreshButtonNodes();

    refreshPreselectedPinboard();

    // begin watching for any DOM changes
    new MutationObserver(() => {
      refreshButtonNodes();
      refreshPreselectedPinboard();
    }).observe(document.body, {
      attributes: false,
      characterData: false,
      childList: true,
      subtree: true,
      attributeOldValue: false,
      characterDataOldValue: false,
    });
  }, []);

  const rawHasWebPushSubscription = useQuery(gqlGetMyUser, {
    client: apolloClient,
  }).data?.getMyUser.hasWebPushSubscription;

  const [hasWebPushSubscription, setHasWebPushSubscription] = useState<
    boolean | null | undefined
  >(rawHasWebPushSubscription);

  useEffect(() => {
    setHasWebPushSubscription(rawHasWebPushSubscription);
  }, [rawHasWebPushSubscription]);

  const usersQuery = useQuery(gqlGetAllUsers, { client: apolloClient });
  //TODO: make use of usersQuery.error and usersQuery.loading

  const allUsers: User[] | undefined = usersQuery.data?.searchUsers.items;

  const userLookup = allUsers?.reduce(
    (lookup, user) => ({
      ...lookup,
      [user.email]: user,
    }),
    {} as { [email: string]: User }
  );

  const [setWebPushSubscriptionForUser] = useMutation<{
    setWebPushSubscriptionForUser: UserWithHasWebPushSubscription;
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

  return (
    <ApolloProvider client={apolloClient}>
      <HiddenIFrameForServiceWorker iFrameRef={serviceWorkerIFrameRef} />
      <Floaty
        userEmail={userEmail}
        preselectedComposerId={preSelectedComposerId}
        payloadToBeSent={payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        userLookup={userLookup}
        hasWebPushSubscription={hasWebPushSubscription}
        showNotification={showDesktopNotification}
        clearDesktopNotificationsForPinboardId={
          clearDesktopNotificationsForPinboardId
        }
      />
      {buttonNodes.map((node, index) => (
        <ButtonPortal
          key={index}
          node={node}
          setPayloadToBeSent={setPayloadToBeSent}
          expand={expandFloaty}
        />
      ))}
    </ApolloProvider>
  );
};
