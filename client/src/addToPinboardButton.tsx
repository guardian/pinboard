import ReactDOM from "react-dom";
import React, { ReactPortal, useContext } from "react";
import PinIcon from "../icons/pin-icon.svg";
import { css } from "@emotion/react";
import { pinboard, pinMetal } from "../colours";
import { buildPayloadAndType, PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import root from "react-shadow/emotion";
import * as Sentry from "@sentry/react";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import {
  IMAGINE_REQUEST_TYPES,
  IMAGING_REQUEST_ITEM_TYPE,
} from "shared/octopusImaging";

export const ASSET_HANDLE_HTML_TAG = "asset-handle";

const buttonCss = css`
  display: flex;
  align-items: center;
  background-color: ${pinboard[500]};
  ${agateSans.xxsmall({ fontWeight: "bold" })};
  border: none;
  border-radius: 100px;
  padding: 0 6px 0 10px;
  line-height: 2;
  cursor: pointer;
  color: ${pinMetal};
`;

const pinIcon = (
  <PinIcon
    css={css`
      height: 14px;
      margin-left: 2px;
      path {
        stroke: ${pinMetal};
        stroke-width: 1px;
      }
    `}
  />
);

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
        ${agateSans.small()}
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
        css={buttonCss}
      >
        {payloadToBeSent.type === "grid-search"
          ? "Add this search to"
          : "Add to"}
        {pinIcon}
      </button>
      {payloadToBeSent.type === "grid-original" && (
        <button
          onClick={() => {
            props.setPayloadToBeSent({
              type: IMAGING_REQUEST_ITEM_TYPE,
              payload: {
                ...payloadToBeSent.payload,
                requestType: IMAGINE_REQUEST_TYPES[0],
              },
            });
            props.expand();
            sendTelemetryEvent?.(
              PINBOARD_TELEMETRY_TYPE.IMAGING_REQUEST_VIA_BUTTON,
              {
                assetType: IMAGING_REQUEST_ITEM_TYPE,
              }
            );
          }}
          css={css`
            ${buttonCss};
            white-space: nowrap;
            margin-top: ${space[1]}px;
          `}
        >
          Imaging order
          {pinIcon}
        </button>
      )}
    </root.div>
  );
};

interface AddToPinboardButtonPortalProps {
  node: HTMLElement;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  expand: () => void;
}

export const AddToPinboardButtonPortal = ({
  node,
  ...props
}: AddToPinboardButtonPortalProps): ReactPortal =>
  ReactDOM.createPortal(
    <AddToPinboardButton dataAttributes={node.dataset} {...props} />,
    node
  );
