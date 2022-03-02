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
import * as Sentry from "@sentry/react";
import { onError } from "@apollo/client/link/error";
import { GIT_COMMIT_HASH } from "../../GIT_COMMIT_HASH";

export function mount({
  userEmail,
  appSyncConfig,
  sentryDSN,
}: ClientConfig): void {
  Sentry.addGlobalEventProcessor((event) => {
    // TODO if event originates from pinboard then return null, to prevent host application from reporting pinboard errors
    return event;
  });

  const pinboardSpecificSentryClient = new Sentry.Hub(
    new Sentry.BrowserClient({
      dsn: sentryDSN,
      release: GIT_COMMIT_HASH, //TODO better to use build number, via environment variable on bootstrapping lambda, then via ClientConfig,
      environment: window.location.hostname,
      tracesSampleRate: 1.0, // We recommend adjusting this value in production, or using tracesSampler for finer control
    })
  );
  pinboardSpecificSentryClient.configureScope((scope) =>
    scope.setUser({
      email: userEmail,
    })
  );

  const apolloUrlInfo: UrlInfo = {
    url: appSyncConfig.graphqlEndpoint,
    region: AWS_REGION,
    auth: {
      type: "AWS_LAMBDA",
      token: appSyncConfig.authToken,
    },
  };

  const apolloErrorLink = onError(({ graphQLErrors, networkError }) => {
    graphQLErrors?.forEach(({ message, ...gqlError }) => {
      console.log(
        `[Apollo - GraphQL error]: Message: ${message}, Location: ${gqlError.locations}, Path: ${gqlError.path}`
      );
      pinboardSpecificSentryClient.captureException(
        Error(`Apollo GraphQL Error : ${message}`),
        {
          captureContext: {
            extra: gqlError as Record<string, any>,
          },
        }
      );
    });

    if (networkError) {
      console.log(`[Apollo - Network error]: ${networkError}`);
      pinboardSpecificSentryClient.captureException(networkError);
    }
  });

  const apolloClient = new ApolloClient({
    link: ApolloLink.from([
      apolloErrorLink,
      createAuthLink(apolloUrlInfo),
      createSubscriptionHandshakeLink(apolloUrlInfo),
    ]),
    cache: new InMemoryCache(),
  });

  const element = document.createElement("pinboard");

  document.body.appendChild(element);

  const PinBoardAppWithSentry = Sentry.withErrorBoundary(PinBoardApp, {
    fallback: <p>an error has occurred</p>,
    beforeCapture(
      scope: Sentry.Scope,
      error: Error | null,
      componentStack: string | null
    ) {
      pinboardSpecificSentryClient.captureException(error, {
        captureContext: {
          ...scope,
          contexts: {
            react: {
              componentStack,
            },
          },
        },
      });
    },
  });

  render(
    <PinBoardAppWithSentry apolloClient={apolloClient} userEmail={userEmail} />,
    element
  );

  if (module["hot"]) {
    module["hot"].accept();
  }
}
