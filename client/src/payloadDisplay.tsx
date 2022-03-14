import React from "react";
import { css } from "@emotion/react";
import { PayloadAndType } from "./types/PayloadAndType";
import { palette, space } from "@guardian/source-foundations";
import { SvgCross } from "@guardian/source-react-components";
import { buttonBackground } from "./styling";

interface PayloadDisplayProps extends PayloadAndType {
  clearPayloadToBeSent?: () => void;
}

export const PayloadDisplay = ({
  // type, TODO consider tweaking display based on type
  payload: { thumbnail, embeddableUrl },
  clearPayloadToBeSent,
}: PayloadDisplayProps) =>
  thumbnail && embeddableUrl ? (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        position: relative;
        padding: ${space[1]}px;
      `}
    >
      <img // TODO: hover for larger thumbnail
        src={thumbnail}
        css={css`
          max-width: 100%;
          max-height: 350px;
        `}
        onDragStart={(event) =>
          event.dataTransfer.setData("URL", embeddableUrl)
        }
      />
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
  ) : null;
