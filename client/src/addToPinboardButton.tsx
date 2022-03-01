import ReactDOM from "react-dom";
import React, { ReactPortal } from "react";
import PinIcon from "../icons/pin-icon.svg";
import { css } from "@emotion/react";
import { pinboard, pinMetal } from "../colours";
import { PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/source-foundations";
import { textSans } from "../fontNormaliser";
import root from "react-shadow/emotion";

export const ASSET_HANDLE_HTML_TAG = "asset-handle";

interface AddToPinboardButtonProps {
  dataAttributes: DOMStringMap;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expand: () => void;
}

const AddToPinboardButton = (props: AddToPinboardButtonProps) => {
  const { source, sourceType, ...payload } = props.dataAttributes;

  return source && sourceType ? (
    <root.div
      css={css`
        ${textSans.small()}
      `}
    >
      <button
        onClick={() => {
          props.setPayloadToBeSent({
            type: `${source}-${sourceType}`,
            payload,
          });
          props.expand();
        }}
        css={css`
          display: flex;
          align-items: center;
          background-color: ${pinboard[500]};
          ${textSans.xsmall()};
          border: none;
          border-radius: 100px;
          padding: 0 ${space[2]}px 0 ${space[3]}px;
          line-height: 2;
          cursor: pointer;
          color: ${pinMetal};
        `}
      >
        Add to
        <PinIcon
          css={css`
            height: 18px;
            margin-left: ${space[1]}px;
            path {
              stroke: ${pinMetal};
              stroke-width: 1px;
            }
          `}
        />{" "}
      </button>
    </root.div>
  ) : null;
};

interface ButtonPortalProps {
  node: HTMLElement;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expand: () => void;
}

export const ButtonPortal = ({
  node,
  ...props
}: ButtonPortalProps): ReactPortal =>
  ReactDOM.createPortal(
    <AddToPinboardButton dataAttributes={node.dataset} {...props} />,
    node
  );
