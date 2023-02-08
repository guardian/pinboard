import "preact/debug";
import React from "react";
import { render } from "react-dom";
import { ClientConfig } from "../../shared/clientConfig";
import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache,
  makeVar,
} from "@apollo/client";
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
import { IPinboardEventTags, TelemetryContext } from "./types/Telemetry";
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

  const hasApolloAuthErrorVar = makeVar(false);

  const apolloErrorLink = onError(({ graphQLErrors, networkError }) => {
    graphQLErrors?.forEach(({ message, ...gqlError }) => {
      console.error(
        `[Apollo - GraphQL error]: Message: ${message}, Location: ${gqlError.locations}, Path: ${gqlError.path}`
      );
      if (
        ((gqlError as unknown) as Record<string, unknown>).errorType ===
          "UnauthorizedException" ||
        gqlError.extensions?.code === "UNAUTHENTICATED"
      ) {
        hasApolloAuthErrorVar(true);
      } else {
        pinboardSpecificSentryClient.captureException(
          Error(`Apollo GraphQL Error : ${message}`),
          {
            captureContext: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              extra: gqlError as Record<string, any>,
            },
          }
        );
      }
    });

    if (networkError) {
      console.error(`[Apollo - Network error]`, networkError);
      if (
        [401, 403].includes(
          ((networkError as unknown) as { statusCode: number })?.statusCode
        ) ||
        ((networkError as unknown) as {
          errors: Array<{ message: string }>;
        })?.errors?.find((error) =>
          error.message?.includes("UnauthorizedException")
        )
      ) {
        hasApolloAuthErrorVar(true);
      } else {
        pinboardSpecificSentryClient.captureException(networkError);
      }
    }
  });

  const apolloSuppressorOnAuthErrorLink = new ApolloLink((operation, next) => {
    if (hasApolloAuthErrorVar()) {
      console.warn("Suppressing Apollo request due to auth error", operation);
      return null;
    } else {
      return next(operation);
    }
  });

  const exposeOperationAsQueryParam = createHttpLink({
    uri: (operation) => {
      const operationNames = operation?.query?.definitions?.flatMap((_) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        _.selectionSet?.selections.map((_) => _.name?.value)
      );
      return operationNames?.length > 0
        ? `${apolloUrlInfo.url}?_${operationNames}`
        : apolloUrlInfo.url;
    },
  });

  const apolloClient = new ApolloClient({
    link: ApolloLink.from(
      /* ORDER IS IMPORTANT */
      [
        new DebounceLink(DEFAULT_APOLLO_DEBOUNCE_DELAY),
        apolloErrorLink,
        apolloSuppressorOnAuthErrorLink,
        createAuthLink(apolloUrlInfo),
        createSubscriptionHandshakeLink(
          apolloUrlInfo,
          exposeOperationAsQueryParam
        ),
      ]
    ),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "ignore",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });

  const element = document.createElement("pinboard");

  document.body.appendChild(element);

  render(
    <TelemetryContext.Provider value={sendTelemetryEvent}>
      <PinBoardApp
        apolloClient={apolloClient}
        userEmail={userEmail}
        hasApolloAuthErrorVar={hasApolloAuthErrorVar}
      />
    </TelemetryContext.Provider>,
    element
  );

  if (module["hot"]) {
    module["hot"].accept();
  }
}
