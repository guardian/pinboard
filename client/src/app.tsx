import "preact/debug";
import React, { useEffect, useRef, useState } from "react";
import { ButtonPortal, ASSET_HANDLE_HTML_TAG } from "./addToPinboardButton";
import { render } from "react-dom";
import { ClientConfig } from "../../shared/clientConfig";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useQuery,
  ApolloLink,
  useMutation,
} from "@apollo/client";
import { AWS_REGION } from "../../shared/awsRegion";
import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { Floaty } from "./floaty";
import { PayloadAndType } from "./types/PayloadAndType";
import {
  Item,
  User,
  UserWithHasWebPushSubscription,
} from "../../shared/graphql/graphql";
import {
  gqlGetAllUsers,
  gqlGetMyUser,
  gqlSetWebPushSubscriptionForUser,
} from "../gql";
import {
  desktopNotificationsPreferencesUrl,
  HiddenIFrameForServiceWorker,
} from "./pushNotificationPreferences";
import { ItemWithParsedPayload } from "./types/ItemWithParsedPayload";
import { UrlInfo } from "aws-appsync-subscription-link/lib/types";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESELECT_PINBOARD_QUERY_PARAM = "pinboardComposerID";
export const EXPAND_PINBOARD_QUERY_PARAM = "expandPinboard";

export function mount({ userEmail, appSyncConfig }: ClientConfig): void {
  const apolloUrlInfo: UrlInfo = {
    url: appSyncConfig.graphqlEndpoint,
    region: AWS_REGION,
    auth: {
      type: "AWS_LAMBDA",
      token: appSyncConfig.authToken,
    },
  };

  const apolloClient = new ApolloClient({
    link: ApolloLink.from([
      createAuthLink(apolloUrlInfo),
      createSubscriptionHandshakeLink(apolloUrlInfo),
    ]),
    cache: new InMemoryCache(),
  });

  const element = document.createElement("pinboard");

  document.body.appendChild(element);

  render(
    React.createElement(PinBoardApp, {
      apolloClient,
      userEmail,
    }),
    element
  );
}

interface PinBoardAppProps {
  apolloClient: ApolloClient<Record<string, unknown>>;
  userEmail: string;
}

const PinBoardApp = ({ apolloClient, userEmail }: PinBoardAppProps) => {
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
