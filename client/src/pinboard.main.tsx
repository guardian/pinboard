import "preact/debug";
import React, { useEffect, useState } from "react";
import { ButtonPortal, ASSET_HANDLE_HTML_TAG } from "./addToPinboardButton";
import { render } from "react-dom";
import { AppSyncConfig } from "../../shared/AppSyncConfig";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  useQuery,
  ApolloLink,
  useMutation,
} from "@apollo/client";
import { AWS_REGION } from "../../shared/awsRegion";
import { createAuthLink } from "aws-appsync-auth-link"; //TODO attempt to factor out
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { Widget } from "./widget";
import { PayloadAndType } from "./types/PayloadAndType";
import { User } from "../../shared/graphql/graphql";
import { gqlGetAllUsers, gqlSetWebPushSubscriptionForUser } from "../gql";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESELECT_PINBOARD_QUERY_PARAM = "pinboardComposerID";
export const EXPAND_PINBOARD_QUERY_PARAM = "expandPinboard";

export function mount({ userEmail, ...appSyncConfig }: AppSyncConfig): void {
  const apolloLink = ApolloLink.from([
    (createAuthLink({
      url: appSyncConfig.graphqlEndpoint,
      region: AWS_REGION,
      auth: { type: "API_KEY", apiKey: appSyncConfig.apiKey },
    }) as unknown) as ApolloLink, //TODO attempt to avoid all this casting
    (createSubscriptionHandshakeLink(
      appSyncConfig.graphqlEndpoint
    ) as unknown) as ApolloLink, // TODO build from appSyncConfig.realtimeEndpoint
  ]);

  const apolloClient = new ApolloClient({
    link: apolloLink,
    cache: new InMemoryCache(),
  });

  const element = document.createElement("pinboard");

  document.body.appendChild(element);

  render(
    React.createElement(PinBoardApp, { apolloClient, userEmail }),
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

  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(
    !!preSelectedComposerIdFromQueryParam || // expand by default when preselected via url query param
      queryParams.get(EXPAND_PINBOARD_QUERY_PARAM)?.toLowerCase() === "true"
  );
  const expandWidget = () => setIsWidgetExpanded(true);

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

  const usersQuery = useQuery(gqlGetAllUsers, { client: apolloClient });
  //TODO: make use of usersQuery.error and usersQuery.loading

  const allUsers: User[] | undefined = usersQuery.data?.searchUsers.items;

  const [userLookup, setUserLookup] = useState<{ [email: string]: User }>();

  useEffect(
    () =>
      setUserLookup(
        allUsers?.reduce(
          (lookup, user) => ({
            ...lookup,
            [user.email]: user,
          }),
          {} as { [email: string]: User }
        )
      ),
    [allUsers]
  );

  const [setWebPushSubscriptionForUser] = useMutation<{
    setWebPushSubscriptionForUser: User;
  }>(gqlSetWebPushSubscriptionForUser, {
    client: apolloClient,
    onCompleted: (updatedUserResult) => {
      const user = updatedUserResult.setWebPushSubscriptionForUser;
      setUserLookup((prevUserLookup) => ({
        ...prevUserLookup,
        [user.email]: user,
      }));
    },
    onError: (error) => {
      const message = "Could not subscribe to desktop notifications";
      alert(message);
      console.error(message, error);
    },
  });

  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (event.source !== window) {
        setWebPushSubscriptionForUser({
          variables: {
            userEmail,
            webPushSubscription: event.data,
          },
        });
      }
    });
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <Widget
        userEmail={userEmail}
        preselectedComposerId={preSelectedComposerId}
        payloadToBeSent={payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        isExpanded={isWidgetExpanded}
        setIsExpanded={setIsWidgetExpanded}
        userLookup={userLookup}
      />
      {buttonNodes.map((node, index) => (
        <ButtonPortal
          key={index}
          node={node}
          setPayloadToBeSent={setPayloadToBeSent}
          expandWidget={expandWidget}
        />
      ))}
    </ApolloProvider>
  );
};
