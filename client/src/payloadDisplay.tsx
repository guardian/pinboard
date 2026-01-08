import React, { useContext, useEffect } from "react";
import { css } from "@emotion/react";
import { PayloadAndType } from "./types/PayloadAndType";
import { neutral, palette, space } from "@guardian/source-foundations";
import { GridStaticImageDisplay } from "./grid/gridStaticImageDisplay";
import { GridDynamicSearchDisplay } from "./grid/gridDynamicSearchDisplay";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import { Tab } from "./types/Tab";
import { FloatingClearButton } from "./floatingClearButton";
import { MamVideoDisplay } from "./mam/mamVideoDisplay";
import { useGlobalStateContext } from "./globalState";
import { FormattedDateTime } from "./formattedDateTime";
import { agateSans } from "../fontNormaliser";

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
  const { userLookup, addEmailsToLookup } = useGlobalStateContext();
  const { payload } = payloadAndType;
  const sendTelemetryEvent = useContext(TelemetryContext);

  const maybeDismissedBy =
    payload.dismissed && userLookup[payload.dismissed.by];
  useEffect(() => {
    payload.dismissed && addEmailsToLookup([payload.dismissed.by]);
  }, [payload.dismissed]);

  return (
    <div
      css={css`
        position: relative;
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
        ${shouldNotBeClickable
          ? ""
          : css`
              cursor: pointer;
            `}
      `}
      onClick={
        shouldNotBeClickable
          ? undefined
          : () => {
              window.open(payload.embeddableUrl, "_blank");
              sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.GRID_ASSET_OPENED, {
                assetType: payloadAndType?.type,
                tab: tab as Tab,
              });
            }
      }
    >
      <div
        css={css`
          display: inline-flex;
          flex-direction: column;
          position: relative;
          padding: ${space[1]}px;
          min-width: 120px;
          max-width: 192px;
          min-height: 60px;
          max-height: 350px;
          color: ${palette.neutral["20"]};
          opacity: ${maybeDismissedBy ? 0.2 : 1};
        `}
        draggable={!shouldNotBeClickable && !maybeDismissedBy}
        onDragStart={(event) => {
          event.dataTransfer.setData("URL", payload.embeddableUrl);
          event.dataTransfer.setData(
            // prevent grid from accepting these as drops, as per https://github.com/guardian/grid/commit/4b72d93eedcbacb4f90680764d468781a72507f5#diff-771b9da876348ce4b4e057e2d8253324c30a8f3db4e434d49b3ce70dbbdb0775R138-R140
            "application/vnd.mediaservice.kahuna.image",
            "true"
          );
          sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.DRAG_FROM_PINBOARD, {
            assetType: payloadAndType?.type,
            ...(tab && { tab }),
          });
        }}
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

        {clearPayloadToBeSent && (
          <FloatingClearButton clear={clearPayloadToBeSent} />
        )}
      </div>
      {maybeDismissedBy && (
        <div
          css={css`
            ${agateSans.xsmall()};
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          `}
        >
          Dismissed by <br />
          {maybeDismissedBy.firstName} {maybeDismissedBy.lastName} <br />
          <FormattedDateTime
            timestamp={payload.dismissed!.at}
            withAgo
            isPartOfSentence
          />
        </div>
      )}
    </div>
  );
};
