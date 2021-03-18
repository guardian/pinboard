/** @jsx jsx */
import ReactDOM from "react-dom";
import React, { ReactPortal } from "react";
import PinIcon from "../icons/pin-icon.svg";
import { css, jsx } from "@emotion/react";
import { pinMetal, pinboardPrimary } from "../colours";
import { User } from "../../shared/User";
import { PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/src-foundations";
import { cssReset, textSans } from "../cssReset";

export const ASSET_HANDLE_HTML_TAG = "asset-handle";

interface AddToPinboardButtonProps {
  dataAttributes: DOMStringMap;
  user: User;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expandWidget: () => void;
}

const AddToPinboardButton = (props: AddToPinboardButtonProps) => {
  const { source, sourceType, ...payload } = props.dataAttributes;

  return source && sourceType ? (
    <div css={cssReset}>
      <button
        onClick={() => {
          props.setPayloadToBeSent({
            type: `${source}-${sourceType}`,
            payload,
          });
          props.expandWidget();
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
        Add to
        <PinIcon
          css={css`
            height: 30px;
            margin-left: ${space[1]}px;
            path {
              stroke: ${pinMetal};
              stroke-width: 1px;
            }
          `}
        />{" "}
      </button>
    </div>
  ) : null;
};

interface ButtonPortalProps {
  node: HTMLElement;
  user: User;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expandWidget: () => void;
}

export const ButtonPortal = ({
  node,
  ...props
}: ButtonPortalProps): ReactPortal =>
  ReactDOM.createPortal(
    <AddToPinboardButton dataAttributes={node.dataset} {...props} />,
    node
  );
