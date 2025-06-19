import React, { useEffect, useMemo, useState } from "react";
import { PinboardData } from "shared/graphql/extraTypes";
import { PinboardIdWithItemCounts } from "shared/graphql/graphql";
import ReactDOM from "react-dom";
import { useApolloClient, useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts, gqlGetPinboardsByPaths } from "../../gql";
import { FrontsPinboardArticleButton } from "./frontsPinboardArticleButton";
import { useGlobalStateContext } from "../globalState";

export const FRONTS_PINBOARD_ELEMENTS_QUERY_SELECTOR =
  "pinboard-article-button";

export const FrontsIntegration = ({
  frontsPinboardElements,
}: {
  frontsPinboardElements: HTMLElement[];
}) => {
  const pathToElementsMap: Partial<{ [path: string]: HTMLElement[] }> = useMemo(
    () =>
      Object.groupBy(
        frontsPinboardElements,
        (htmlElement) => htmlElement.dataset.urlPath ?? "undefined"
      ),
    [frontsPinboardElements]
  );

  const {
    setError,
    totalItemsReceivedViaSubscription,
    totalOfMyOwnOnSeenItemsReceivedViaSubscription,
  } = useGlobalStateContext();

  const apolloClient = useApolloClient();

  const [pathToPinboardDataMap, setPathToPinboardDataMap] = useState(
    {} as { [path: string]: PinboardData }
  );
  useEffect(() => {
    const pathsYetToBeLookedUp = Object.keys(pathToElementsMap).filter(
      (path) => !pathToPinboardDataMap[path]
    );
    pathsYetToBeLookedUp.length > 0 &&
      apolloClient
        .query({
          query: gqlGetPinboardsByPaths,
          variables: {
            paths: pathsYetToBeLookedUp,
          },
        })
        .then(({ data }) => {
          data?.getPinboardsByPaths &&
            setPathToPinboardDataMap((prevState) =>
              data.getPinboardsByPaths.reduce(
                (acc: { [path: string]: PinboardData }, stub: PinboardData) =>
                  stub.path ? { ...acc, [stub.path]: stub } : acc,
                prevState
              )
            );
        })
        .catch((error) => setError("unknown", error));
  }, [pathToElementsMap]);

  interface ItemCountsLookup {
    [pinboardId: string]: PinboardIdWithItemCounts;
  }
  const [maybeItemCountsLookup, setMaybeItemCountsLookup] = useState();

  const pinboardIds = useMemo(
    () => Object.values(pathToPinboardDataMap).map(({ id }) => id),
    [pathToPinboardDataMap]
  );

  const [fetchItemCounts] = useLazyQuery(gqlGetItemCounts);

  useEffect(() => {
    if (pinboardIds.length > 0) {
      fetchItemCounts({
        variables: { pinboardIds },
        onCompleted: (data) => {
          data?.getItemCounts &&
            setMaybeItemCountsLookup(
              data.getItemCounts.reduce(
                (
                  acc: ItemCountsLookup,
                  itemCounts: PinboardIdWithItemCounts
                ) => ({
                  ...acc,
                  [itemCounts.pinboardId]: itemCounts,
                }),
                {}
              )
            );
        },
      });
    }
  }, [
    pinboardIds,
    totalItemsReceivedViaSubscription,
    totalOfMyOwnOnSeenItemsReceivedViaSubscription,
  ]);

  return (
    <>
      {Object.entries(pathToElementsMap).map(
        ([path, htmlElementsToMountInto]) =>
          htmlElementsToMountInto!.map((htmlElementToMountInto) =>
            ReactDOM.createPortal(
              <FrontsPinboardArticleButton
                maybePinboardData={pathToPinboardDataMap[path]}
                hasCountsLoaded={!!maybeItemCountsLookup}
                maybeItemCounts={
                  pathToPinboardDataMap[path] &&
                  maybeItemCountsLookup &&
                  maybeItemCountsLookup[pathToPinboardDataMap[path].id]
                }
                withDraggableThumbsOfRatio={
                  htmlElementToMountInto.dataset.withDraggableThumbsOfRatio
                }
              />,
              htmlElementToMountInto
            )
          )
      )}
    </>
  );
};
