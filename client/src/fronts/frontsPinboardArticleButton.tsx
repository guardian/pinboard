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
import { SvgSpinner } from "@guardian/source-react-components";

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

  const [getItems, { loading }] = useLazyQuery(gqlGetInitialItems);

  useEffect(() => {
    if (isPinboardData(maybePinboardData) && withDraggableThumbsOfRatio) {
      getItems({
        variables: {
          pinboardId: maybePinboardData.id,
          maybeAspectRatioFilter: withDraggableThumbsOfRatio,
        },
      }).then(({ data }) => {
        data?.listItems &&
          setCropsAtRequiredRatio(
            data.listItems.map((item: Item) => [
              JSON.parse(item.payload!),
              item,
            ])
          );
      });
    }
  }, [
    maybePinboardData,
    withDraggableThumbsOfRatio,
    maybeItemCounts?.totalCropCount,
  ]);

  const tooltipText = (() => {
    if (!hasCountsLoaded) {
      return "Loading item counts...";
    }
    if (!maybePinboardData) {
      return "This piece is not tracked in workflow, which is required to chat and share assets (such as crops) via Pinboard.";
    }
    if (maybeItemCounts) {
      return `${maybeItemCounts.totalCount} items with ${maybeItemCounts.totalCropCount} crops (${maybeItemCounts.fiveByFourCount} at 5:4 and ${maybeItemCounts.fourByFiveCount} at 4:5)`;
    }
  })();

  return (
    <root.span>
      <ButtonInOtherTools
        extraCss={css`
          display: inline-flex;
          background-color: ${maybePinboardData
            ? pinboard[500]
            : neutral["60"]};
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
        title={tooltipText}
      >
        {!hasCountsLoaded && <SvgSpinner size="xsmall" />}
        {hasCountsLoaded && !maybePinboardData && "N/A"}
        {maybePinboardData &&
          hasCountsLoaded &&
          (maybeItemCounts?.totalCount || 0)}
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
              {cropsAtRequiredRatio.map(([payload, item]) => (
                <img
                  key={item.id}
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
