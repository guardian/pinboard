import React, { useState } from "react";
import { Item } from "../../shared/graphql/graphql";
import { ItemInputBox } from "./itemInputBox";
import { useGlobalStateContext } from "./globalState";
import { css } from "@emotion/react";
import { useMutation } from "@apollo/client";
import { gqlEditItem } from "../gql";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { composer } from "../colours";

interface EditItemProps {
  item: Item;
  cancel: () => void;
}

export const EditItem = ({ item, cancel }: EditItemProps) => {
  const { payloadToBeSent, clearPayloadToBeSent } = useGlobalStateContext();

  const [message, setMessage] = useState(item.message);

  const [editItem, { loading }] = useMutation(gqlEditItem, {
    variables: {
      itemId: item.id,
      input: {
        message: message || null,
        payload: payloadToBeSent
          ? JSON.stringify(payloadToBeSent.payload)
          : null,
        type: payloadToBeSent?.type || "message-only",
      },
    },
    onCompleted: cancel,
    onError: (error) => {
      console.error(error);
      alert(`failed to update item`);
    },
  });

  const canUpdate = message || payloadToBeSent;

  return (
    <div
      css={css`
        position: relative;
        z-index: 99999;
      `}
    >
      <ItemInputBox
        payloadToBeSent={payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        message={message || ""}
        setMessage={setMessage}
        panelElement={document.body} // could we pass panelElement down from Pinboard?
        isSending={loading}
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
          disabled={loading || !canUpdate}
        >
          Update
        </button>
        <button
          onClick={cancel}
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
