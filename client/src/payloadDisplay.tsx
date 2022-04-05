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
      `}
      draggable
      onDragStart={(event) =>
        event.dataTransfer.setData("URL", payload.embeddableUrl)
      }
      onClick={() => {
        /* TODO open embeddableUrl in new tab (also 'cursor: pointer') */
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
          onClick={clearPayloadToBeSent}
        >
          <SvgCross />
        </div>
      )}
    </div>
  );
};
