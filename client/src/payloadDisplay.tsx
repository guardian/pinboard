import React, { useContext, useMemo } from "react";
import { css } from "@emotion/react";
import sanitizeHtml from "sanitize-html";
import { PayloadAndType } from "./types/PayloadAndType";
import { brand, neutral, palette, space } from "@guardian/source-foundations";
import { GridStaticImageDisplay } from "./grid/gridStaticImageDisplay";
import { GridDynamicSearchDisplay } from "./grid/gridDynamicSearchDisplay";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import { Tab } from "./types/Tab";
import { FloatingClearButton } from "./floatingClearButton";
import { MamVideoDisplay } from "./mam/mamVideoDisplay";

interface PayloadDisplayProps {
  payloadAndType: PayloadAndType;
  clearPayloadToBeSent?: () => void;
  tab?: Tab;
  shouldNotBeClickable?: true;
}

export const PayloadDisplay = ({
  payloadAndType,
  clearPayloadToBeSent,
  tab,
  shouldNotBeClickable,
}: PayloadDisplayProps) => {
  const { payload } = payloadAndType;
  const sendTelemetryEvent = useContext(TelemetryContext);

  const safeSnippetHtml = useMemo(() => {
    return payloadAndType.type === "newswires-snippet"
      ? sanitizeHtml(payloadAndType.payload.embeddableHtml)
      : undefined;
  }, [payloadAndType]);

  return (
    <div
      css={css`
        margin: ${space[1]}px 0;
        border: 1px solid ${neutral[86]};
        border-radius: ${space[1]}px;
        max-width: fit-content;
        background-color: ${neutral[93]};
        &:hover {
          ${shouldNotBeClickable
            ? ""
            : css`
                background-color: ${neutral[86]};
              `}
        }
      `}
    >
      <div
        css={css`
          display: inline-flex;
          flex-direction: column;
          position: relative;
          padding: ${space[1]}px;
          max-width: 192px;
          max-height: 350px;
          color: ${palette.neutral["20"]};
          ${shouldNotBeClickable
            ? ""
            : css`
                cursor: pointer;
              `}
        `}
        draggable={!shouldNotBeClickable}
        onDragStart={(event) => {
          if (payloadAndType.type === "newswires-snippet") {
            // event.dataTransfer.setData("text/plain", "This is text to drag");

            event.dataTransfer.setData(
              "text/html",
              sanitizeHtml(payloadAndType.payload.embeddableHtml)
            );
          } else {
            event.dataTransfer.setData("URL", payload.embeddableUrl);
            event.dataTransfer.setData(
              // prevent grid from accepting these as drops, as per https://github.com/guardian/grid/commit/4b72d93eedcbacb4f90680764d468781a72507f5#diff-771b9da876348ce4b4e057e2d8253324c30a8f3db4e434d49b3ce70dbbdb0775R138-R140
              "application/vnd.mediaservice.kahuna.image",
              "true"
            );
          }
          sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.DRAG_FROM_PINBOARD, {
            assetType: payloadAndType?.type,
            ...(tab && { tab }),
          });
        }}
        onClick={
          shouldNotBeClickable
            ? undefined
            : () => {
                window.open(payload.embeddableUrl, "_blank");
                sendTelemetryEvent?.(
                  PINBOARD_TELEMETRY_TYPE.GRID_ASSET_OPENED,
                  {
                    assetType: payloadAndType?.type,
                    tab: tab as Tab,
                  }
                );
              }
        }
      >
        {(payloadAndType.type === "grid-crop" ||
          payloadAndType.type === "grid-original") && (
          <GridStaticImageDisplay
            type={payloadAndType.type}
            payload={payloadAndType.payload}
          />
        )}

        {payloadAndType.type === "grid-search" && (
          <GridDynamicSearchDisplay
            payload={payloadAndType.payload}
            shouldNotBeClickable={shouldNotBeClickable}
          />
        )}

        {payloadAndType.type === "mam-video" && (
          <MamVideoDisplay
            type={payloadAndType.type}
            payload={payloadAndType.payload}
          />
        )}
        {payloadAndType.type === "newswires-snippet" && (
          <div
            css={css`
              font-size: 0.8rem;
              display: flex;
              flex-direction: column;
              gap: 2px;
              width: 192px;
            `}
          >
            <strong>Newswires snippet:</strong>
            <blockquote
              css={css`
                font-size: 0.8rem;
                overflow-y: auto;
                margin: 0;
                padding: 0 0 0 ${space[1]}px;
                border-left: 4px solid ${brand[800]};
                background-color: ${neutral[100]};
                max-height: 175px;
                overflow-y: auto;
              `}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: safeSnippetHtml || "",
                }}
              />
            </blockquote>
          </div>
        )}

        {clearPayloadToBeSent && (
          <FloatingClearButton clear={clearPayloadToBeSent} />
        )}
      </div>
    </div>
  );
};
