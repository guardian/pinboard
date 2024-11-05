import React, { useEffect, useMemo, useState } from "react";
import { PinboardData } from "shared/graphql/extraTypes";
import { PinboardIdWithItemCounts } from "shared/graphql/graphql";
import ReactDOM from "react-dom";
import { useApolloClient } from "@apollo/client";
import { gqlGetItemCounts, gqlGetPinboardsByPaths } from "../../gql";
import { FrontsPinboardArticleButton } from "./frontsPinboardArticleButton";

export const FRONTS_PINBOARD_ELEMENTS_QUERY_SELECTOR =
  "pinboard-article-button";

export const isRunningWithinFrontsTool = [
  "fronts.local.dev-gutools.co.uk",
  "fronts.code.dev-gutools.co.uk",
  "fronts.gutools.co.uk",
].includes(window.location.hostname);

export const FrontsIntegration = ({
  frontsPinboardElements,
}: {
  frontsPinboardElements: HTMLElement[];
}) => {
  const pathToElementsMap: { [path: string]: HTMLElement[] } = useMemo(
    () =>
      frontsPinboardElements.reduce(
        // TODO could be replaced with groupBy if we upgrade to latest ES in tsconfig
        (acc, htmlElement) =>
          htmlElement.dataset.urlPath
            ? {
                ...acc,
                [htmlElement.dataset.urlPath]: [
                  ...(acc[htmlElement.dataset.urlPath] || []),
                  htmlElement,
                ],
              }
            : acc,
        {} as Record<string, HTMLElement[]>
      ),
    [frontsPinboardElements]
  );

  const apolloClient = useApolloClient();

  const [pathToPinboardDataMap, setPathToPinboardDataMap] = useState(
    {} as { [path: string]: PinboardData }
  );
  useEffect(() => {
    const paths = Object.keys(pathToElementsMap);
    paths.length > 0 &&
      apolloClient
        .query({
          query: gqlGetPinboardsByPaths,
          variables: {
            paths,
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
        });
    //TODO handle errors
  }, [pathToElementsMap]);

  interface ItemCountsLookup {
    [pinboardId: string]: PinboardIdWithItemCounts;
  }
  const [maybeItemCountsLookup, setMaybeItemCountsLookup] = useState();
  useEffect(() => {
    const pinboardIds = Object.values(pathToPinboardDataMap).map(
      ({ id }) => id
    );
    pinboardIds.length > 0 &&
      apolloClient
        .query({
          query: gqlGetItemCounts,
          variables: {
            pinboardIds,
          },
          //FIXME implement polling (probably means converting this one to a hook)
        })
        .then(({ data }) => {
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
        });
  }, [pathToPinboardDataMap]);

  return (
    <>
      {Object.entries(pathToElementsMap).map(
        ([path, htmlElementsToMountInto]) =>
          htmlElementsToMountInto.map((htmlElementToMountInto) =>
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
