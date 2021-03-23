import React, { useEffect, useState } from "react";
import { ButtonPortal, ASSET_HANDLE_HTML_TAG } from "./addToPinboardButton";
import { render } from "react-dom";
import { AppSyncConfig } from "../../shared/AppSyncConfig";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ApolloLink } from "apollo-link";
import { AWS_REGION } from "../../shared/awsRegion";
import { createAuthLink } from "aws-appsync-auth-link"; //TODO attempt to factor out
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { Widget } from "./widget";
import { PayloadAndType } from "./types/PayloadAndType";

const PRESELECT_PINBOARD_HTML_TAG = "pinboard-preselect";
const PRESELECT_PINBOARD_QUERY_PARAM = "pinboardComposerID";

export function mount({ userEmail, ...appSyncConfig }: AppSyncConfig): void {
  const apolloLink = ApolloLink.from([
    createAuthLink({
      url: appSyncConfig.graphqlEndpoint,
      region: AWS_REGION,
      auth: { type: "API_KEY", apiKey: appSyncConfig.apiKey },
    }) as any,
    createSubscriptionHandshakeLink(appSyncConfig.graphqlEndpoint), // TODO build from appSyncConfig.realtimeEndpoint
  ]);

  const apolloClient = new ApolloClient({
    link: apolloLink as any, //TODO attempt to avoid all this casting to any
    cache: new InMemoryCache() as any,
  });

  const element = document.createElement("pinboard");

  document.body.appendChild(element);

  render(
    React.createElement(PinBoardApp, { apolloClient, userEmail }),
    element
  );
}

interface PinBoardAppProps {
  apolloClient: ApolloClient<unknown>;
  userEmail: string;
}

const PinBoardApp = ({ apolloClient, userEmail }: PinBoardAppProps) => {
  const [payloadToBeSent, setPayloadToBeSent] = useState<PayloadAndType | null>(
    null
  );
  const clearPayloadToBeSent = () => setPayloadToBeSent(null);

  const [buttonNodes, setButtonNodes] = useState<HTMLElement[]>([]);

  // using state here but without setter, because host application/SPA might change url
  // and lose the query param but we don't want to lose the preselection
  const [preSelectedComposerIdFromQueryParam] = useState(
    new URLSearchParams(window.location.search).get(
      PRESELECT_PINBOARD_QUERY_PARAM
    )
  );

  const [preSelectedComposerId, setPreselectedComposerId] = useState<
    string | null | undefined
  >(preSelectedComposerIdFromQueryParam);

  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(
    !!preSelectedComposerIdFromQueryParam // expand by default when preselected via url query param
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

  return (
    <ApolloProvider client={apolloClient}>
      <Widget
        userEmail={userEmail}
        preselectedComposerId={preSelectedComposerId}
        payloadToBeSent={payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        isExpanded={isWidgetExpanded}
        setIsExpanded={setIsWidgetExpanded}
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
