import ReactDOM from "react-dom";
import React, { ReactPortal } from "react";

export const PIN_BUTTON_HTML_TAG = "add-to-pinboard-button";

interface AddToPinboardButtonProps {
  dataAttributes: DOMStringMap;
}

const AddToPinboardButton = (props: AddToPinboardButtonProps) => (
  <button
    className="btn btn--deep"
    onClick={() => alert(JSON.stringify(props.dataAttributes, null, "  "))}
  >
    📌 Add to pinboard
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
