import ReactDOM from "react-dom";
import React, { ReactPortal, useContext } from "react";
import { css } from "@emotion/react";
import { buildPayloadAndType, PayloadAndType } from "./types/PayloadAndType";
import { agateSans } from "../fontNormaliser";
import root from "react-shadow/emotion";
import * as Sentry from "@sentry/react";
import { TelemetryContext, PINBOARD_TELEMETRY_TYPE } from "./types/Telemetry";
import { ButtonInOtherTools } from "./buttonInOtherTools";
import {
  IMAGINE_REQUEST_TYPES,
  IMAGING_REQUEST_ITEM_TYPE,
} from "shared/octopusImaging";

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
        ${agateSans.small()}
      `}
    >
      <ButtonInOtherTools
        iconAtEnd
        onClick={() => {
          props.setPayloadToBeSent(payloadToBeSent);
          props.expand();
          sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.ADD_TO_PINBOARD_BUTTON, {
            assetType: payloadToBeSent.type,
          });
        }}
      >
        {payloadToBeSent.type === "grid-search"
          ? "Add this search to"
          : "Add to"}
      </ButtonInOtherTools>
      {payloadToBeSent.type === "grid-original" && (
        <ButtonInOtherTools
          extraCss={css`
            margin-top: 5px;
          `}
          iconAtEnd
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
        >
          Imaging order
        </ButtonInOtherTools>
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
