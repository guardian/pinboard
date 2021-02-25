/** @jsx jsx */
import ReactDOM from "react-dom";
import React, { ReactPortal } from "react";
import PinIcon from "../icons/pin-icon.svg";
import { css, jsx } from "@emotion/react";
import { pinMetal, pinboardPrimary } from "../colours";

export const PIN_BUTTON_HTML_TAG = "pinboard-add-button";

interface AddToPinboardButtonProps {
  dataAttributes: DOMStringMap;
}

const AddToPinboardButton = (props: AddToPinboardButtonProps) => (
  <button
    onClick={() => alert(JSON.stringify(props.dataAttributes, null, "  "))}
    css={css`
      display: flex;
      align-items: center;
      background-color: ${pinboardPrimary};
      border: none;
      border-radius: 100px;
      padding: 1px 8px 0 12px;
      font-size: 14px;
      line-height: 2;
      cursor: pointer;
      color: ${pinMetal};
    `}
  >
    Add to
    <PinIcon
      css={css`
        height: 30px;
        margin-left: 4px;
        path {
          stroke: ${pinMetal};
          stroke-width: 1px;
        }
      `}
    />{" "}
  </button>
);

interface ButtonPortalProps {
  node: HTMLElement;
}

export const ButtonPortal = ({ node }: ButtonPortalProps): ReactPortal =>
  ReactDOM.createPortal(
    <AddToPinboardButton dataAttributes={node.dataset} />,
    node
  );
