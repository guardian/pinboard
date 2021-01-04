import React, { useEffect, useState } from "react";
import { ButtonPortal, PIN_BUTTON_HTML_TAG } from "./addToPinboardButton";
import { render } from "react-dom";
import { AppSyncConfig } from "../../shared/AppSyncConfig";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ApolloLink } from "apollo-link";
import { AWS_REGION } from "../../shared/awsRegion";
import { createAuthLink } from "aws-appsync-auth-link"; //TODO attempt to factor out
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { User } from "../../shared/User"; //TODO attempt to factor out
import { Widget } from "./widget";

const PRESELECT_PINBOARD_HTML_TAG = "preselect-pinboard";

export function mount({ user, ...appSyncConfig }: AppSyncConfig): void {
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

  render(React.createElement(PinBoardApp, { apolloClient, user }), element);
}

interface PinBoardAppProps {
  apolloClient: ApolloClient<unknown>;
  user: User;
}

const PinBoardApp = ({ apolloClient, user }: PinBoardAppProps) => {
  const [buttonNodes, setButtonNodes] = useState<HTMLElement[]>([]);

  const [preSelectedComposerId, setPreselectedComposerId] = useState<string>();

  const refreshButtonNodes = () =>
    setButtonNodes(Array.from(document.querySelectorAll(PIN_BUTTON_HTML_TAG)));

  const refreshPreselectedPinboard = () =>
    setPreselectedComposerId(
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
      <Widget user={user} preselectedComposerId={preSelectedComposerId} />
      {buttonNodes.map((node, index) => (
        <ButtonPortal key={index} node={node} />
      ))}
    </ApolloProvider>
  );
};
