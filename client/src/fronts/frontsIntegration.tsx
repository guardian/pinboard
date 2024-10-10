import React, { useEffect, useMemo, useState } from "react";
import { useGlobalStateContext } from "../globalState";
import { PinboardData } from "shared/graphql/extraTypes";
import { PinboardIdWithItemCounts } from "shared/graphql/graphql";
import ReactDOM from "react-dom";
import root from "react-shadow/emotion";
import { css } from "@emotion/react";
import { useApolloClient } from "@apollo/client";
import { gqlGetItemCounts, gqlGetPinboardsByPaths } from "../../gql";
import { pinboard } from "../../colours";
import { neutral } from "@guardian/source-foundations";
import { ButtonInOtherTools } from "../buttonInOtherTools";

export const FRONTS_PINBOARD_ELEMENTS_QUERY_SELECTOR =
  "pinboard-article-button";

interface PinboardArticleButtonProps {
  maybePinboardData: PinboardData | undefined;
  maybeItemCounts: PinboardIdWithItemCounts | undefined;
}
const PinboardArticleButton = ({
  maybePinboardData,
  maybeItemCounts,
}: PinboardArticleButtonProps) => {
  const { setIsExpanded, openPinboard } = useGlobalStateContext();

  return (
    <root.span>
      <ButtonInOtherTools
        extraCss={css`
          background-color: ${maybePinboardData
            ? pinboard[500]
            : neutral["60"]};
        `}
        onClick={(event) => {
          event.stopPropagation();
          if (maybePinboardData) {
            setIsExpanded(true);
            openPinboard(false)(maybePinboardData, false); // TODO probably should be 'peek at pinboard' from panel.tsx
          } else {
            alert(
              "This piece is not tracked in workflow, this is needed to chat and share assets such as crops via Pinboard."
            );
            // TODO consider offering an option to create workflow tracking
          }
        }}
      >
        {!maybePinboardData && "not tracked in workflow"}
        {maybeItemCounts && (
          <>
            {
              maybeItemCounts.unreadCount ||
                null /*TODO display number in red blob*/
            }
            {maybeItemCounts.unreadCount > 0 && " unread of "}
            {maybeItemCounts.totalCount}
            {" items "}
            {maybeItemCounts.totalCropCount > 0 && (
              <>
                {" with "}
                {maybeItemCounts.totalCropCount}
                {" crops "}
                {(maybeItemCounts.fiveByFourCount > 0 ||
                  maybeItemCounts.fourByFiveCount > 0) &&
                  " (incl."}
                {maybeItemCounts.fiveByFourCount > 0 &&
                  `${maybeItemCounts.fiveByFourCount} at 5:4`}
                {maybeItemCounts.fourByFiveCount > 0 &&
                  `${maybeItemCounts.fourByFiveCount} at 4:5`}
                {(maybeItemCounts.fiveByFourCount > 0 ||
                  maybeItemCounts.fourByFiveCount > 0) &&
                  ")"}
              </>
            )}
          </>
        )}
      </ButtonInOtherTools>
    </root.span>
  );
};

export const FrontsIntegration = ({
  frontsPinboardElements,
}: {
  frontsPinboardElements: HTMLElement[];
}) => {
  const pathToElementMap: { [path: string]: HTMLElement } = useMemo(
    () =>
      frontsPinboardElements.reduce(
        (acc, htmlElement) =>
          htmlElement.dataset.urlPath
            ? {
                ...acc,
                [htmlElement.dataset.urlPath]: htmlElement,
              }
            : acc,
        {} as Record<string, HTMLElement>
      ),
    [frontsPinboardElements]
  );

  const apolloClient = useApolloClient();

  const [pathToPinboardDataMap, setPathToPinboardDataMap] = useState(
    {} as { [path: string]: PinboardData }
  );
  useEffect(() => {
    const paths = Object.keys(pathToElementMap); // TODO filter out ones we already have data for
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
  }, [pathToElementMap]);

  const [allItemCounts, setAllItemCounts] = useState(
    [] as PinboardIdWithItemCounts[]
  );
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
        })
        .then(({ data }) => {
          data?.getItemCounts && setAllItemCounts(data.getItemCounts); // TODO consider building a map (to avoid finds later) like we do for the other user of getItemCounts
        });
  }, [pathToPinboardDataMap]);

  return (
    <>
      {Object.entries(pathToElementMap).map(([path, htmlElementToMountInto]) =>
        ReactDOM.createPortal(
          <PinboardArticleButton
            maybePinboardData={pathToPinboardDataMap[path]}
            maybeItemCounts={
              pathToPinboardDataMap[path] &&
              allItemCounts.find(
                ({ pinboardId }) =>
                  pinboardId === pathToPinboardDataMap[path]?.id
              )
            }
          />,
          htmlElementToMountInto
        )
      )}
    </>
  );
};
