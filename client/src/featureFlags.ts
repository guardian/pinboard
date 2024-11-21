import { readAndThenSilentlyDropQueryParamFromURL } from "./util";
import { ApolloClient } from "@apollo/client";
import { gqlChangeFeatureFlag } from "../gql";
import { IPinboardEventTags, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import { IUserTelemetryEvent } from "@guardian/user-telemetry-client";

export const ALLOWED_FEATURE_FLAGS = [
  "test",
  "alternateCropSuggesting",
] as const;
export type AllowedFeatureFlags = (typeof ALLOWED_FEATURE_FLAGS)[number];

export type FeatureFlags = Partial<Record<AllowedFeatureFlags, boolean>>;

export const extractFeatureFlags = (
  featureFlagsStr: string | null | undefined
): FeatureFlags =>
  featureFlagsStr ? (JSON.parse(featureFlagsStr) as FeatureFlags) : {};

export const consumeFeatureFlagQueryParamsAndUpdateAccordingly = (
  apolloClient: ApolloClient<unknown>,
  previousFeatureFlags: FeatureFlags,
  sendTelemetryEvent: (
    type: PINBOARD_TELEMETRY_TYPE,
    tags?: IUserTelemetryEvent["tags"] & IPinboardEventTags,
    value?: boolean | number
  ) => void
) =>
  ALLOWED_FEATURE_FLAGS.forEach((flagId) => {
    const flagStringValue = readAndThenSilentlyDropQueryParamFromURL(
      `pinboardFeatureFlag_${flagId}`
    );
    if (flagStringValue !== null) {
      apolloClient
        .mutate({
          mutation: gqlChangeFeatureFlag,
          variables: {
            flagId,
            newValue: flagStringValue === "true",
          },
        })
        .then(({ data }) => {
          const latestFeatureFlags = extractFeatureFlags(
            data.changeFeatureFlag.featureFlags
          );
          if (
            previousFeatureFlags.alternateCropSuggesting === false &&
            latestFeatureFlags.alternateCropSuggesting === true
          ) {
            console.log(
              "'alternateCropSuggesting' feature flag successfully turned ON (when it wasn't before)"
            );
            sendTelemetryEvent(
              PINBOARD_TELEMETRY_TYPE.ALTERNATE_CROP_SUGGESTING_FEATURE_TURNED_ON
            );
          } else if (
            previousFeatureFlags.alternateCropSuggesting === true &&
            latestFeatureFlags.alternateCropSuggesting === false
          ) {
            console.log(
              "'alternateCropSuggesting' feature flag successfully turned OFF (when it was on before)"
            );
            sendTelemetryEvent(
              PINBOARD_TELEMETRY_TYPE.ALTERNATE_CROP_SUGGESTING_FEATURE_TURNED_OFF
            );
          }
        })
        .catch(console.error);
      // we rely on the subscription 'updateUserWithChanges' to deliver the
      // MyUser changes back to all connected clients (like we do for manuallyAddedPinboardIds)
    }
  });
