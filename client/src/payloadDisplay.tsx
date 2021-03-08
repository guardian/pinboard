/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import { pinMetal } from "../colours";
import { PayloadAndType } from "./types/PayloadAndType";

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
            height: 20px;
            width: 20px;
            background-color: ${pinMetal};
            box-shadow: 0 0 4px 2px white;
            opacity: 0.8;
            color: white;
            border-radius: 50%;
            text-align: center;
            cursor: pointer;
          `}
          onClick={clearPayloadToBeSent}
        >
          ╳
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
