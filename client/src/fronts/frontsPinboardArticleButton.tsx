import { isPinboardData, PinboardData } from "shared/graphql/extraTypes";
import { Item, PinboardIdWithItemCounts } from "shared/graphql/graphql";
import { useGlobalStateContext } from "../globalState";
import { useLazyQuery } from "@apollo/client";
import React, { useContext, useEffect, useState } from "react";
import { PayloadWithThumbnail } from "../types/PayloadAndType";
import { gqlGetInitialItems } from "../../gql";
import root from "react-shadow/emotion";
import { ButtonInOtherTools } from "../buttonInOtherTools";
import { css } from "@emotion/react";
import { pinboard } from "../../colours";
import { neutral } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "../types/Telemetry";

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
  const { peekAtPinboard } = useGlobalStateContext();

  const sendTelemetryEvent = useContext(TelemetryContext);

  const [cropsAtRequiredRatio, setCropsAtRequiredRatio] = useState<
    Array<[PayloadWithThumbnail, Item]>
  >([]);

  const [getItems, { loading }] = useLazyQuery(
    gqlGetInitialItems //TODO consider creating new query,
  );

  useEffect(() => {
    if (isPinboardData(maybePinboardData) && withDraggableThumbsOfRatio) {
      getItems({
        variables: {
          pinboardId: maybePinboardData.id,
        },
      }).then(({ data }) => {
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
            peekAtPinboard(maybePinboardData.id);
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

      <div
        css={css`
          margin-left: 20px;
          ${agateSans.xxsmall()};
          overflow: auto;
          margin-bottom: 3px;
        `}
      >
        {loading && (
          <em>
            loading {withDraggableThumbsOfRatio} crops suggested via Pinboard...
          </em>
        )}
        {cropsAtRequiredRatio && cropsAtRequiredRatio.length > 0 && (
          <>
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
                  onDragEnd={(event) =>
                    sendTelemetryEvent?.(
                      PINBOARD_TELEMETRY_TYPE.ALTERNATE_CROP_DRAGGED,
                      payload.aspectRatio
                        ? {
                            aspectRatio: payload.aspectRatio,
                            embeddableUrl: payload.embeddableUrl,
                            dropEffect: event.dataTransfer.dropEffect,
                          }
                        : undefined
                    )
                  }
                  onClick={() => {
                    peekAtPinboard(item.pinboardId, item.id);
                  }}
                ></img>
              ))}
            </div>
            <em>These can be dragged onto the trail image to replace it.</em>
          </>
        )}
      </div>
    </root.span>
  );
};
