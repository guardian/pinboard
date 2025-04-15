import { readAndThenSilentlyDropQueryParamFromURL } from "./util";
import { ApolloClient } from "@apollo/client";
import { gqlChangeFeatureFlag } from "../gql";

export const ALLOWED_FEATURE_FLAGS = [] as const;
export type AllowedFeatureFlags = (typeof ALLOWED_FEATURE_FLAGS)[number];

export type FeatureFlags = Partial<Record<AllowedFeatureFlags, boolean>>;

export const extractFeatureFlags = (
  featureFlagsStr: string | null | undefined
): FeatureFlags =>
  featureFlagsStr ? (JSON.parse(featureFlagsStr) as FeatureFlags) : {};

export const consumeFeatureFlagQueryParamsAndUpdateAccordingly = (
  apolloClient: ApolloClient<unknown>
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
          console.log(
            "Latest feature flags:",
            extractFeatureFlags(data.changeFeatureFlag.featureFlags)
          );
        })
        .catch(console.error);
      // we rely on the subscription 'updateUserWithChanges' to deliver the
      // MyUser changes back to all connected clients (like we do for manuallyAddedPinboardIds)
    }
  });
