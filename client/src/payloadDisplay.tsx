import React, { useContext } from "react";
import { css } from "@emotion/react";
import { PayloadAndType } from "./types/PayloadAndType";
import { neutral, palette, space } from "@guardian/source-foundations";
import { SvgCross } from "@guardian/source-react-components";
import { buttonBackground } from "./styling";
import { GridStaticImageDisplay } from "./grid/gridStaticImageDisplay";
import { GridDynamicSearchDisplay } from "./grid/gridDynamicSearchDisplay";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import { Tab } from "./types/Tab";

interface PayloadDisplayProps {
  payloadAndType: PayloadAndType;
  clearPayloadToBeSent?: () => void;
  tab?: Tab;
}

export const PayloadDisplay = ({
  payloadAndType,
  clearPayloadToBeSent,
  tab,
}: PayloadDisplayProps) => {
  const { payload } = payloadAndType;
  const sendTelemetryEvent = useContext(TelemetryContext);
  return (
    <div
      css={css`
        margin: ${space[1]}px 0;
        border: 1px solid ${neutral[86]};
        border-radius: ${space[1]}px;
        max-width: fit-content;
        background-color: ${neutral[93]};
        &:hover {
          background-color: ${neutral[86]};
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
          cursor: pointer;
        `}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("URL", payload.embeddableUrl);
          event.dataTransfer.setData(
            // prevent grid from accepting these as drops, as per https://github.com/guardian/grid/commit/4b72d93eedcbacb4f90680764d468781a72507f5#diff-771b9da876348ce4b4e057e2d8253324c30a8f3db4e434d49b3ce70dbbdb0775R138-R140
            "application/vnd.mediaservice.kahuna.image",
            "true"
          );
        }}
        onClick={() => {
          window.open(payload.embeddableUrl, "_blank");
          sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.GRID_ASSET_OPENED, {
            assetType: payloadAndType?.type,
            tab: tab as Tab,
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
          <GridDynamicSearchDisplay payload={payloadAndType.payload} />
        )}

        {clearPayloadToBeSent && (
          <div
            css={css`
              height: ${space[5]}px;
              width: ${space[5]}px;
              border-radius: ${space[5]}px;
              ${buttonBackground(palette.neutral[60])};
              background-color: ${palette.neutral[46]};
              fill: ${palette.neutral[100]};

              &:hover {
                background-color: ${palette.neutral[20]};
              }

              &:active {
                background-color: ${palette.neutral[86]};
                fill: ${palette.neutral[20]};
              }
              position: absolute;
              right: ${space[2]}px;
              top: ${space[2]}px;
            `}
            onClick={(event) => {
              event.stopPropagation();
              clearPayloadToBeSent();
            }}
          >
            <SvgCross />
          </div>
        )}
      </div>
    </div>
  );
};
