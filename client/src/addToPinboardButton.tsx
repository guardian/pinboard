import ReactDOM from "react-dom";
import React, { ReactPortal, useContext } from "react";
import PinIcon from "../icons/pin-icon.svg";
import { css } from "@emotion/react";
import { pinboard, pinMetal } from "../colours";
import { buildPayloadAndType, PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/source-foundations";
import { openSans } from "../fontNormaliser";
import root from "react-shadow/emotion";
import * as Sentry from "@sentry/react";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";

export const ASSET_HANDLE_HTML_TAG = "asset-handle";

interface AddToPinboardButtonProps {
  dataAttributes: DOMStringMap;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expand: () => void;
}

const AddToPinboardButton = (props: AddToPinboardButtonProps) => {
  const { source, sourceType, ...payload } = props.dataAttributes;

  const payloadToBeSent = buildPayloadAndType(
    `${source}-${sourceType}`,
    payload
  );

  if (!payloadToBeSent) {
    Sentry.captureException(
      new Error(
        `Failed to build an add to pinboard button for payload where source=${source} sourceType=${sourceType} payload=${JSON.stringify(
          payload
        )}`
      )
    );
    return null;
  }

  const sendTelemetryEvent = useContext(TelemetryContext);

  return (
    <root.div
      css={css`
        ${openSans.small()}
      `}
    >
      <button
        onClick={() => {
          props.setPayloadToBeSent(payloadToBeSent);
          props.expand();
          sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.ADD_TO_PINBOARD_BUTTON, {
            assetType: payloadToBeSent.type,
          });
        }}
        css={css`
          display: flex;
          align-items: center;
          background-color: ${pinboard[500]};
          ${openSans.xsmall()};
          border: none;
          border-radius: 100px;
          padding: 0 ${space[2]}px 0 ${space[3]}px;
          line-height: 2;
          cursor: pointer;
          color: ${pinMetal};
        `}
      >
        {payloadToBeSent.type === "grid-search"
          ? "Add this search to"
          : "Add to"}
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
  );
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
