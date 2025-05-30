import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ButtonInOtherTools } from "../buttonInOtherTools";
import { css } from "@emotion/react";
import { PayloadWithThumbnail } from "../types/PayloadAndType";
import root from "react-shadow/emotion";
import { useApolloClient } from "@apollo/client";
import { useGlobalStateContext } from "../globalState";
import { CreateItemInput } from "shared/graphql/graphql";
import { gqlCreateItem } from "../../gql";
import { isPinboardData } from "shared/graphql/extraTypes";
import { agateSans } from "../../fontNormaliser";
import { pinboard, pinMetal } from "../../colours";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "../types/Telemetry";

export const SUGGEST_ALTERNATE_CROP_QUERY_SELECTOR =
  "pinboard-suggest-alternate-crops";

const SUGGESTIBLE_CROP_RATIOS = {
  "4:5": "Portrait",
  "1:1": "Square",
  "5:4": "Landscape",
};

const gridTopLevelDomain = window.location.hostname.endsWith(".gutools.co.uk")
  ? "gutools.co.uk"
  : "test.dev-gutools.co.uk";

interface GridCropDataFromPostMessage {
  id: string;
  specification: {
    aspectRatio: keyof typeof SUGGESTIBLE_CROP_RATIOS;
    uri: string;
  };
  assets: Array<{
    secureUrl: string;
    size: number;
  }>;
}

export const SuggestAlternateCrops = ({
  alternateCropSuggestionElements,
}: {
  alternateCropSuggestionElements: HTMLElement[];
}) => {
  const [maybeGridIFrameUrl, setMaybeGridIframeUrl] = useState<string | null>(
    null
  );

  const {
    setIsExpanded,
    preselectedPinboard,
    peekAtPinboard,
    setPayloadToBeSent,
    clearSelectedPinboard,
    cropsOnPreselectedPinboard,
    setError,
    openInTool,
  } = useGlobalStateContext();

  const sendTelemetryEvent = useContext(TelemetryContext);

  const apolloClient = useApolloClient();

  const onClick = useCallback(
    (maybeMediaId: string | undefined, cropType: string, customRatio: string) =>
      () =>
        setMaybeGridIframeUrl(
          `https://media.${gridTopLevelDomain}${
            maybeMediaId ? `/images/${maybeMediaId}/crop` : ""
          }?cropType=${cropType}&customRatio=${cropType},${customRatio
            .split(":")
            .join(",")}`
        ),
    []
  );

  const handleSelectedCrop = useCallback(
    (data: GridCropDataFromPostMessage) => {
      const pinboardPayload: PayloadWithThumbnail = {
        thumbnail: data.assets.reduce((smallest, asset) =>
          smallest.size > asset.size ? asset : smallest
        ).secureUrl,
        embeddableUrl: `${data.specification.uri.replace(
          "https://api.",
          "https://"
        )}?crop=${data.id}`,
        aspectRatio: data.specification.aspectRatio,
        cropType: SUGGESTIBLE_CROP_RATIOS[data.specification.aspectRatio],
      };
      if (isPinboardData(preselectedPinboard)) {
        const createItemInput: CreateItemInput = {
          claimable: false,
          groupMentions: null,
          mentions: null,
          message: null, //TODO consider automated message explaining why its there??
          payload: JSON.stringify(pinboardPayload),
          pinboardId: preselectedPinboard.id,
          relatedItemId: null,
          type: "grid-crop",
        };
        apolloClient
          .mutate({
            mutation: gqlCreateItem,
            variables: {
              input: createItemInput,
            },
          })
          .then(() => {
            sendTelemetryEvent?.(
              PINBOARD_TELEMETRY_TYPE.ALTERNATE_CROP_SUGGESTED,
              pinboardPayload.aspectRatio && pinboardPayload.embeddableUrl
                ? {
                    pinboardId: preselectedPinboard.id,
                    aspectRatio: pinboardPayload.aspectRatio,
                    embeddableUrl: pinboardPayload.embeddableUrl, // could probably refactor to extract mediaId and cropId properly
                  }
                : undefined
            );
            peekAtPinboard(preselectedPinboard.id);
            setIsExpanded(true);
          })
          .catch((error) => setError(preselectedPinboard.id, error));
      } else {
        clearSelectedPinboard();
        setPayloadToBeSent({
          type: "grid-crop",
          payload: pinboardPayload,
        });
        setIsExpanded(true);
      }
      setMaybeGridIframeUrl(null);
    },
    [preselectedPinboard]
  );

  useEffect(() => {
    if (maybeGridIFrameUrl) {
      const handleGridMessage = (event: MessageEvent) =>
        maybeGridIFrameUrl.includes(event.origin) &&
        event.data &&
        handleSelectedCrop(event.data.crop.data);
      window.addEventListener("message", handleGridMessage);
      return () => window.removeEventListener("message", handleGridMessage); // Cleanup/unmount function
    }
  }, [maybeGridIFrameUrl]);

  const AlreadySuggestedCropsForRatio = ({
    customRatio,
    containerWidth,
  }: {
    customRatio: string;
    containerWidth: number;
  }) => {
    if (!cropsOnPreselectedPinboard) return null;
    const cropsMatchingRatio = cropsOnPreselectedPinboard.filter(
      ([_]) => _.aspectRatio === customRatio
    );
    const shouldDisplayHoverOnLeft = containerWidth < 550;
    return (
      <div
        css={css`
          position: relative;
          width: 100%;
          ${agateSans.xxsmall()};
          color: ${openInTool === "media-atom-maker" ? "white" : pinMetal};
          margin-top: 2px;
          margin-bottom: 5px;
          user-select: none;
          text-align: center;
          &:hover {
            box-shadow: ${shouldDisplayHoverOnLeft ? -5 : 5}px 0 0
              ${cropsMatchingRatio.length ? pinboard["500"] : "transparent"};
            background-color: ${cropsMatchingRatio.length
              ? pinboard["500"]
              : "transparent"};
            > div {
              display: block;
            }
          }
        `}
      >
        {cropsMatchingRatio.length} crop
        {cropsMatchingRatio.length === 1 ? "" : "s"} at{" "}
        <strong>{customRatio}</strong> already suggested
        {cropsMatchingRatio.length > 0 && (
          <div
            css={css`
              display: none;
              position: absolute;
              ${shouldDisplayHoverOnLeft ? "left" : "right"}: -5px;
              bottom: 50%;
              transform: translate(
                ${shouldDisplayHoverOnLeft ? -100 : 100}%,
                50%
              );
              z-index: 9999;
              padding: 5px;
              border-radius: 3px;
              border: 3px solid ${pinboard["500"]};
              background: white;
            `}
          >
            <div
              css={css`
                display: flex;
                flex-direction: row;
                gap: 5px;
                overflow-x: auto;
                max-width: 350px;
              `}
            >
              {cropsMatchingRatio.map(([payload, item], index) => (
                <img
                  key={index}
                  css={css`
                    max-width: 100px;
                    max-height: 100px;
                    cursor: pointer;
                  `}
                  src={payload.thumbnail}
                  onClick={() => {
                    peekAtPinboard(item.pinboardId, item.id);
                  }}
                ></img>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {alternateCropSuggestionElements.map((htmlElement) =>
        ReactDOM.createPortal(
          <div>
            <label
              css={css`
                font-weight: bold;
              `}
            >
              Suggest crops for Fronts
            </label>
            <br />
            <root.div
              css={css`
                display: inline-flex;
                flex-direction: column;
                margin: 5px 0;
                align-items: center;
              `}
            >
              {preselectedPinboard === "loading" && "loading..."}
              {preselectedPinboard === "notTrackedInWorkflow" &&
                "This piece is not tracked in Workflow, as such you cannot suggest alternate crops for it. Please track in Workflow and refresh the page."}
              {preselectedPinboard === "unknown" &&
                "This video hasn't been added to a Composer piece and tracked in Workflow, as such you cannot suggest alternate crops for it."}
              {isPinboardData(preselectedPinboard) &&
                Object.entries(SUGGESTIBLE_CROP_RATIOS).map(
                  ([customRatio, cropType]) => (
                    <>
                      <ButtonInOtherTools
                        onClick={onClick(
                          htmlElement.dataset.mediaId,
                          cropType,
                          customRatio
                        )}
                      >
                        Suggest an alternate {customRatio} crop
                      </ButtonInOtherTools>
                      <AlreadySuggestedCropsForRatio
                        customRatio={customRatio}
                        containerWidth={
                          htmlElement.getBoundingClientRect().width
                        }
                      />
                    </>
                  )
                )}
            </root.div>
          </div>,
          htmlElement
        )
      )}
      {maybeGridIFrameUrl && (
        <root.div
          css={css`
            z-index: 99999;
            background: rgba(0, 0, 0, 0.5);
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            padding: 25px;
          `}
        >
          <iframe
            src={maybeGridIFrameUrl}
            css={css`
              width: 100%;
              height: 100%;
              background-color: #333;
            `}
          />
          <button
            onClick={() => setMaybeGridIframeUrl(null)}
            css={css`
              position: absolute;
              top: 0;
              right: 0;
              //TODO improve close button
            `}
          >
            CLOSE
          </button>
        </root.div>
      )}
    </>
  );
};
