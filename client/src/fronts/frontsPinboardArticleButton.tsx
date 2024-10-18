import { isPinboardData, PinboardData } from "shared/graphql/extraTypes";
import { Item, PinboardIdWithItemCounts } from "shared/graphql/graphql";
import { useGlobalStateContext } from "../globalState";
import { useApolloClient } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { PayloadWithThumbnail } from "../types/PayloadAndType";
import { gqlGetInitialItems } from "../../gql";
import root from "react-shadow/emotion";
import { ButtonInOtherTools } from "../buttonInOtherTools";
import { css } from "@emotion/react";
import { pinboard } from "../../colours";
import { neutral } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";

interface FrontsPinboardArticleButtonProps {
  maybePinboardData: PinboardData | undefined;
  maybeItemCounts: PinboardIdWithItemCounts | undefined;
  withDraggableThumbsOfRatio: string | undefined;
  hasCountsLoaded: boolean;
}

export const FrontsPinboardArticleButton = ({
  maybePinboardData,
  maybeItemCounts,
  withDraggableThumbsOfRatio,
  hasCountsLoaded,
}: FrontsPinboardArticleButtonProps) => {
  const { setIsExpanded, openPinboard } = useGlobalStateContext();

  const apolloClient = useApolloClient();

  const [cropsAtRequiredRatio, setCropsAtRequiredRatio] = useState<
    Array<[PayloadWithThumbnail, Item]>
  >([]);

  useEffect(() => {
    if (isPinboardData(maybePinboardData) && withDraggableThumbsOfRatio) {
      //TODO consider converting to lazy query hook, so we can have a loading state easily
      apolloClient
        .query({
          query: gqlGetInitialItems(maybePinboardData.id), //TODO consider creating new query
        })
        .then(({ data }) => {
          data?.listItems &&
            setCropsAtRequiredRatio(
              data.listItems.reduce(
                (acc: Array<[PayloadWithThumbnail, Item]>, item: Item) => {
                  const parsedPayload =
                    item.payload &&
                    (JSON.parse(item.payload) as PayloadWithThumbnail);
                  if (
                    item.type === "grid-crop" &&
                    parsedPayload &&
                    parsedPayload.aspectRatio === withDraggableThumbsOfRatio
                  ) {
                    return [...acc, [parsedPayload, item]];
                  } else {
                    return acc;
                  }
                },
                []
              )
            );
        });
    }
  }, [
    maybePinboardData,
    withDraggableThumbsOfRatio,
    maybeItemCounts?.totalCropCount,
  ]);

  return (
    <root.span>
      <ButtonInOtherTools
        extraCss={css`
          display: inline-flex;
          background-color: ${maybePinboardData
            ? pinboard[500]
            : neutral["60"]};
          // TODO fix line-height when button text wraps over multiple lines
        `}
        onClick={(event) => {
          event.stopPropagation();
          if (maybePinboardData) {
            setIsExpanded(true);
            openPinboard(false)(maybePinboardData, false); // TODO probably should be 'peek at pinboard' from panel.tsx
          } else {
            alert(
              "This piece is not tracked in workflow, which is required to chat and share assets (such as crops) via Pinboard."
            );
          }
        }}
      >
        {!maybePinboardData && "Not tracked in workflow"}
        {maybePinboardData && !hasCountsLoaded && <em>loading...</em>}
        {maybePinboardData && hasCountsLoaded && !maybeItemCounts && "0 items"}
        {maybeItemCounts && (
          <>
            {
              maybeItemCounts.unreadCount ||
                null /*TODO move to absolute position top right of button in red blob*/
            }
            {maybeItemCounts.unreadCount > 0 && " unread of "}
            {maybeItemCounts.totalCount}
            &nbsp;items
            {maybeItemCounts.totalCropCount > 0 && (
              <>
                &nbsp;with&nbsp;
                {maybeItemCounts.totalCropCount}
                &nbsp;crops
                <wbr /> ({maybeItemCounts.fiveByFourCount}
                &nbsp;at&nbsp;5:4&nbsp;and&nbsp;
                {maybeItemCounts.fourByFiveCount}&nbsp;at&nbsp;4:5)
              </>
            )}
          </>
        )}
      </ButtonInOtherTools>
      {cropsAtRequiredRatio && cropsAtRequiredRatio.length > 0 && (
        <div
          css={css`
            margin-left: 20px;
            ${agateSans.xxsmall()};
            overflow: auto;
            margin-bottom: 3px;
          `}
        >
          <strong>
            The {withDraggableThumbsOfRatio} crops suggested via Pinboard:
          </strong>
          <div
            css={css`
              display: flex;
              gap: 3px;
            `}
          >
            {cropsAtRequiredRatio.map(([payload, item], index) => (
              <img
                key={index}
                css={css`
                  max-width: 100px;
                  max-height: 100px;
                  cursor: grab;

                  &:active {
                    cursor: grabbing;
                  }
                `}
                src={payload.thumbnail}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("URL", payload.embeddableUrl);
                }}
                onClick={
                  () => console.log(item.id) //TODO open pinboard and scroll to selected item to see context
                }
              ></img>
            ))}
          </div>
          <em>These can be dragged onto the trail image to replace it.</em>
        </div>
      )}
    </root.span>
  );
};
