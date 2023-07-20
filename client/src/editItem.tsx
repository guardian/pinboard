import React, { useContext, useMemo, useRef, useState } from "react";
import { Item } from "../../shared/graphql/graphql";
import { ItemInputBox } from "./itemInputBox";
import { useGlobalStateContext } from "./globalState";
import { css } from "@emotion/react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { gqlAsGridPayload, gqlEditItem } from "../gql";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { composer } from "../colours";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";
import { useTourProgress } from "./tour/tourState";
import { demoPinboardData } from "./tour/tourConstants";

interface EditItemProps {
  item: Item;
  cancel: () => void;
}

export const EditItem = ({ item, cancel }: EditItemProps) => {
  const { payloadToBeSent, setPayloadToBeSent, clearPayloadToBeSent } =
    useGlobalStateContext();
  const sendTelemetryEvent = useContext(TelemetryContext);

  const telemetryPayloadCommon = {
    pinboardId: item.pinboardId,
    itemId: item.id,
  };

  const [message, setMessage] = useState(item.message);

  const type = payloadToBeSent?.type || "message-only";

  const payload = useMemo(
    () => (payloadToBeSent ? JSON.stringify(payloadToBeSent.payload) : null),
    [payloadToBeSent]
  );

  const tourProgress = useTourProgress();

  const [_editItem, { loading }] = useMutation(gqlEditItem, {
    onCompleted: () => {
      sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.UPDATE_ITEM, {
        ...telemetryPayloadCommon,
        hasMessageChanged: item.message !== message,
        hasTypeChanged: item.type !== type,
        hasPayloadChanged: item.payload !== payload,
      });
      cancel();
    },
    onError: (error) => {
      console.error(error);
      alert(`failed to update item`);
    },
  });

  const editItem = () => {
    const theUpdate = {
      variables: {
        itemId: item.id,
        input: {
          message: message || null,
          payload,
          type,
        },
      },
    };
    if (tourProgress.isRunning) {
      return tourProgress.editItem(cancel)(theUpdate);
    } else if (item.pinboardId === demoPinboardData.id) {
      throw new Error(
        "Demo/Tour NOT running, but message edit attempt on 'demo' pinboard"
      );
    } else {
      return _editItem(theUpdate);
    }
  };

  const canUpdate = message || payloadToBeSent;

  const ref = useRef<HTMLDivElement | null>(null);

  const [asGridPayload, { loading: isAsGridPayloadLoading }] = useLazyQuery<{
    asGridPayload: string | null;
  }>(gqlAsGridPayload);

  return (
    <div
      ref={ref}
      css={css`
        position: relative;
        z-index: 99999;
      `}
    >
      <ItemInputBox
        payloadToBeSent={payloadToBeSent}
        setPayloadToBeSent={setPayloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        message={message || ""}
        setMessage={setMessage}
        isSending={loading}
        panelElement={ref.current}
        asGridPayload={asGridPayload}
        isAsGridPayloadLoading={isAsGridPayloadLoading}
      />
      <div
        css={css`
          margin-top: ${space[1]}px;
          display: flex;
          gap: ${space[1]}px;
          justify-content: flex-end;
          button {
            cursor: pointer;
            display: flex;
            flex-direction: row;
            padding: ${space[1]}px ${space[2]}px;
            border-radius: ${space[1]}px;
            border: 1px solid ${composer.primary[300]};
            ${agateSans.xxsmall({ fontWeight: "bold" })};
          }
        `}
      >
        <button
          onClick={() => editItem()}
          css={css`
            color: ${palette.neutral[100]};
            background-color: ${composer.primary[300]};
            &:disabled {
              color: ${palette.neutral[20]};
              cursor: no-drop;
            }
            &:hover {
              border-color: ${composer.primary[400]};
              background-color: ${composer.primary[400]};
            }
          `}
          disabled={loading || !canUpdate || isAsGridPayloadLoading}
        >
          Update
        </button>
        <button
          onClick={() => {
            sendTelemetryEvent?.(
              PINBOARD_TELEMETRY_TYPE.CANCEL_UPDATE_ITEM,
              telemetryPayloadCommon
            );
            cancel();
          }}
          css={css`
            color: ${composer.primary[300]};
            background-color: ${palette.neutral[100]};
            &:hover {
              background-color: ${palette.neutral[93]};
            }
          `}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
