/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import { pinMetal } from "../colours";
import { PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/src-foundations";
import CrossIcon from "../icons/cross-icon.svg";

interface PayloadDisplayProps extends PayloadAndType {
  clearPayloadToBeSent?: () => void;
  heightPx?: number;
}

export const PayloadDisplay = ({
  // type, TODO consider tweaking display based on type
  payload: { thumbnail, embeddableUrl },
  clearPayloadToBeSent,
  heightPx,
}: PayloadDisplayProps) =>
  thumbnail && embeddableUrl ? (
    <div
      css={css`
        position: relative;
        display: inline-block;
      `}
    >
      {clearPayloadToBeSent && (
        <div
          css={css`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            height: ${space[5]}px;
            width: ${space[5]}px;
            background-color: ${pinMetal};
            box-shadow: 0 0 ${space[1]}px 2px white;
            opacity: 0.8;
            border-radius: 50%;
            text-align: center;
            cursor: pointer;
          `}
          onClick={clearPayloadToBeSent}
        >
          <CrossIcon
            css={css`
              padding-top: 2px;
            `}
          />
        </div>
      )}
      <img // TODO: hover for larger thumbnail
        src={thumbnail}
        css={css`
          max-height: ${heightPx ?? 75}px;
          box-shadow: 2px 2px 5px 0px ${pinMetal};
        `}
        onDragStart={(event) =>
          event.dataTransfer.setData("URL", embeddableUrl)
        }
      />
    </div>
  ) : null;
