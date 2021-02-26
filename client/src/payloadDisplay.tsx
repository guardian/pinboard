/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import { pinMetal } from "../colours";

export type Payload = Record<string, string | undefined>;

export interface PayloadAndType {
  type: string;
  payload: Payload;
}

interface PayloadDisplayProps extends PayloadAndType {
  clearPayloadToBeSent?: () => void;
  heightPx?: number;
}

const getToolsStageDomain = (specificURL: string) => {
  if (specificURL.includes(".local.dev")) {
    return "local.dev-gutools.co.uk";
  } else if (specificURL.includes(".test.dev")) {
    return "test.dev-gutools.co.uk";
  } else if (specificURL.includes(".code.dev")) {
    return "code.dev-gutools.co.uk";
  }
  return "gutools.co.uk";
};

export const PayloadDisplay = ({
  type,
  payload,
  clearPayloadToBeSent,
  heightPx,
}: PayloadDisplayProps) => {
  const dragURL =
    payload?.gridCropThumbnail &&
    `https://media.${getToolsStageDomain(payload.gridCropThumbnail)}/images/${
      payload.gridImageId
    }?crop=${payload.gridCropId}`;

  switch (type) {
    case "grid-crop":
      return (
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
            src={payload?.gridCropThumbnail}
            css={css`
              max-height: ${heightPx ?? 75}px;
              box-shadow: 2px 2px 5px 0px ${pinMetal};
            `}
            onDragStart={(event) =>
              dragURL && event.dataTransfer.setData("URL", dragURL)
            }
          />
        </div>
      );
    default:
      return null;
  }
};
