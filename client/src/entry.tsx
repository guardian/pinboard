import "preact/debug";
import React from "react";
import { render } from "react-dom";
import { ClientConfig } from "../../shared/clientConfig";
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { AWS_REGION } from "../../shared/awsRegion";
import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { UrlInfo } from "aws-appsync-subscription-link/lib/types";
import { PinBoardApp } from "./app";

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

  if (module["hot"]) {
    module["hot"].accept();
  }
}
