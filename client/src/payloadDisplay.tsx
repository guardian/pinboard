import React from "react";
import { css } from "@emotion/react";
import { PayloadAndType } from "./types/PayloadAndType";
import { palette, space } from "@guardian/source-foundations";
import { SvgCross } from "@guardian/source-react-components";
import { buttonBackground } from "./styling";
import { GridStaticImageDisplay } from "./grid/gridStaticImageDisplay";
import { GridDynamicSearchDisplay } from "./grid/gridDynamicSearchDisplay";

interface PayloadDisplayProps {
  payloadAndType: PayloadAndType;
  clearPayloadToBeSent?: () => void;
}

export const PayloadDisplay = ({
  payloadAndType,
  clearPayloadToBeSent,
}: PayloadDisplayProps) => {
  const { payload } = payloadAndType;
  return (
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
  );
};
