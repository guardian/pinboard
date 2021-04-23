/** @jsx jsx */
import ReactDOM from "react-dom";
import React from "react";
import PinIcon from "../icons/pin-icon.svg";
import { css, jsx } from "@emotion/react";
import { pinMetal, pinboardPrimary } from "../colours";
import { PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/src-foundations";
import { cssReset, textSans } from "../cssReset";

export const ASSET_HANDLE_HTML_TAG = "asset-handle";
export const ASSET_USAGE_HTML_TAG = "asset-usage";

interface AddToPinboardButtonPortalProps {
  node: HTMLElement;
  type: string;
  payload: DOMStringMap;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expandWidget: () => void;
  label?: string;
}

export const AddToPinboardButtonPortal = ({
  node,
  type,
  payload,
  setPayloadToBeSent,
  expandWidget,
  label,
}: AddToPinboardButtonPortalProps) =>
  ReactDOM.createPortal(
    <div css={cssReset}>
      <button
        onClick={(event) => {
          event.stopPropagation();
          setPayloadToBeSent({
            type,
            payload,
          });
          expandWidget();
        }}
        css={css`
          display: flex;
          align-items: center;
          background-color: ${pinboardPrimary};
          ${textSans.xsmall()};
          border: none;
          border-radius: 100px;
          padding: 0 ${space[2]}px 0 ${space[3]}px;
          line-height: 2;
          cursor: pointer;
          color: ${pinMetal};
        `}
      >
        {label || "Add to "}
        <PinIcon
          css={css`
            height: 30px;
            margin-left: ${space[1]}px;
            path {
              stroke: ${pinMetal};
              stroke-width: 1px;
            }
          `}
        />
      </button>
    </div>,
    node
  );
