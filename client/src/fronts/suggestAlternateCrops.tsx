import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ButtonInOtherTools } from "../buttonInOtherTools";
import { css } from "@emotion/react";
import {
  PayloadWithThumbnail,
  StaticGridPayload,
} from "../types/PayloadAndType";
import root from "react-shadow/emotion";
import { useApolloClient } from "@apollo/client";
import { useGlobalStateContext } from "../globalState";
import { CreateItemInput } from "shared/graphql/graphql";
import { gqlCreateItem } from "../../gql";
import { isPinboardData, PinboardData } from "shared/graphql/extraTypes";

export const SUGGEST_ALTERNATE_CROP_QUERY_SELECTOR =
  "pinboard-suggest-alternate-crops";

const SUGGESTIBLE_CROP_RATIOS = {
  "5:4": "Landscape",
  "4:5": "Portrait",
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
  // TODO take in some count of existing crops (so people know it doesn't need doing again)
}) => {
  // FIXME handle the piece not being tracked in workflow

  const [maybeGridIFrameUrl, setMaybeGridIframeUrl] = useState<string | null>(
    null
  );

  const {
    setIsExpanded,
    preselectedPinboard,
    openPinboard,
    setPayloadToBeSent,
    clearSelectedPinboard,
  } = useGlobalStateContext();

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
            openPinboard(false)(preselectedPinboard, false);
            setIsExpanded(true);
          }); // TODO handle errors with catch
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
  return (
    <>
      {alternateCropSuggestionElements.map((htmlElement) =>
        ReactDOM.createPortal(
          <root.div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 5px;
              margin: 5px 0;
            `}
          >
            {Object.entries(SUGGESTIBLE_CROP_RATIOS).map(
              ([customRatio, cropType]) => (
                <ButtonInOtherTools
                  key={customRatio}
                  onClick={onClick(
                    htmlElement.dataset.mediaId,
                    cropType,
                    customRatio
                  )}
                >
                  Suggest an alternate {customRatio} crop
                </ButtonInOtherTools>
              )
            )}
          </root.div>,
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
