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
import * as SentryHub from "@sentry/hub";
import { onError } from "@apollo/client/link/error";
import { GIT_COMMIT_HASH } from "../../GIT_COMMIT_HASH";
import { BUILD_NUMBER } from "../../BUILD_NUMBER";
import DebounceLink from "apollo-link-debounce";
import {
  IUserTelemetryEvent,
  UserTelemetryEventSender,
} from "@guardian/user-telemetry-client";
import { TelemetryContext, IPinboardEventTags } from "./types/Telemetry";
import { APP } from "../../shared/constants";

const SENTRY_REROUTED_FLAG = "rerouted";

const DEFAULT_APOLLO_DEBOUNCE_DELAY = 0; // zero in-case used by mistake

export function mount({
  userEmail,
  appSyncConfig,
  sentryDSN,
  stage,
}: ClientConfig): void {
  const sentryUser = {
    email: userEmail,
  };
  const sentryConfig = {
    dsn: sentryDSN,
    release: `${BUILD_NUMBER} (${GIT_COMMIT_HASH})`,
    environment: window.location.hostname,
    tracesSampleRate: 1.0, // We recommend adjusting this value in production, or using tracesSampler for finer control
  };
  const pinboardSpecificSentryClient = new Sentry.Hub(
    new Sentry.BrowserClient(sentryConfig)
  );
  pinboardSpecificSentryClient.configureScope((scope) =>
    scope.setUser(sentryUser)
  );

  const currentHub = Sentry.getHubFromCarrier(SentryHub.getMainCarrier());
  const existingSentryClient = currentHub.getClient();

  // if host application doesn't have Sentry initialised, then init here to ensure the GlobalEventProcessor will do its thing
  if (!existingSentryClient) {
    Sentry.init(sentryConfig);
    Sentry.setUser(sentryUser);
  }

  Sentry.addGlobalEventProcessor((event, eventHint) => {
    if (
      existingSentryClient &&
      event.fingerprint?.includes(SENTRY_REROUTED_FLAG) &&
      event.exception?.values?.find((exception) =>
        exception.stacktrace?.frames?.find((frame) =>
          frame.filename?.includes("pinboard.main")
        )
      )
    ) {
      pinboardSpecificSentryClient.captureEvent(
        {
          ...event,
          fingerprint: [...(event.fingerprint || []), SENTRY_REROUTED_FLAG],
        },
        eventHint
      );
      return null; // stop event from being sent to host application's Sentry project
    }
    return event;
  });

  const telemetryDomain =
    stage === "PROD" ? "gutools.co.uk" : "code.dev-gutools.co.uk";

  const telemetryEventService = new UserTelemetryEventSender(
    `https://user-telemetry.${telemetryDomain}`
  );

  const sendTelemetryEvent = (
    type: string,
    tags?: IUserTelemetryEvent["tags"] & IPinboardEventTags,
    value: boolean | number = true
  ): void => {
    const event = {
      app: APP,
      stage: stage,
      eventTime: new Date().toISOString(),
      type,
      value,
      tags: {
        ...tags,
        platform: window.location.hostname, // e.g. composer.gutools.co.uk
      },
    };
    console.log("telemetry", event); // to delete later
    telemetryEventService.addEvent(event);
  };

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
      console.error(
        `[Apollo - GraphQL error]: Message: ${message}, Location: ${gqlError.locations}, Path: ${gqlError.path}`
      );
      pinboardSpecificSentryClient.captureException(
        Error(`Apollo GraphQL Error : ${message}`),
        {
          captureContext: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            extra: gqlError as Record<string, any>,
          },
        }
      );
    });

    if (networkError) {
      console.error(`[Apollo - Network error]: ${networkError}`);
      pinboardSpecificSentryClient.captureException(networkError);
    }
  });

  const apolloClient = new ApolloClient({
    link: ApolloLink.from([
      new DebounceLink(DEFAULT_APOLLO_DEBOUNCE_DELAY), // order is important
      apolloErrorLink,
      createAuthLink(apolloUrlInfo),
      createSubscriptionHandshakeLink(apolloUrlInfo),
    ]),
    cache: new InMemoryCache(),
  });

  const element = document.createElement("pinboard");

  document.body.appendChild(element);

  render(
    <TelemetryContext.Provider value={sendTelemetryEvent}>
      <PinBoardApp apolloClient={apolloClient} userEmail={userEmail} />
    </TelemetryContext.Provider>,
    element
  );

  if (module["hot"]) {
    module["hot"].accept();
  }
}
