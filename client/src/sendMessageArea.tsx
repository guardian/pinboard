import { ApolloError, useMutation } from "@apollo/client";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React, { useState } from "react";
import { Item, User } from "../../shared/graphql/graphql";
import { gqlCreateItem } from "../gql";
import { CreateItemInputBox } from "./createItemInputBox";
import { PayloadAndType } from "./types/PayloadAndType";
import { PendingItem } from "./types/PendingItem";
import { userToMentionHandle } from "./util";
import { composer } from "../colours";
import SendArrow from "../icons/send.svg";
import { buttonBackground } from "./styling";

interface SendMessageAreaProps {
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  allUsers: User[] | undefined;
  onSuccessfulSend: (item: PendingItem) => void;
  onError: (error: ApolloError) => void;
  userEmail: string;
  pinboardId: string;
  panelElement: HTMLDivElement | null;
}

export const SendMessageArea = ({
  payloadToBeSent,
  clearPayloadToBeSent,
  allUsers,
  onSuccessfulSend,
  onError,
  pinboardId,
  panelElement,
}: SendMessageAreaProps) => {
  const [message, setMessage] = useState<string>("");
  const [unverifiedMentions, setUnverifiedMentions] = useState<User[]>([]);
  const addUnverifiedMention = (user: User) =>
    setUnverifiedMentions((prevState) => [...prevState, user]); // TODO: also make user unique in list
  const verifiedMentionEmails = unverifiedMentions
    .filter((user) => message.includes(userToMentionHandle(user)))
    .map((user) => user.email);

  const [sendItem] = useMutation<{ createItem: Item }>(gqlCreateItem, {
    onCompleted: (sendMessageResult) => {
      onSuccessfulSend({
        ...sendMessageResult.createItem,
        pending: true,
      });
      setMessage("");
      clearPayloadToBeSent();
      setUnverifiedMentions([]);
    },
    onError,
    variables: {
      input: {
        type: payloadToBeSent?.type || "message-only",
        message,
        payload: payloadToBeSent && JSON.stringify(payloadToBeSent.payload),
        pinboardId,
        mentions: verifiedMentionEmails,
      },
    },
  });

  return (
    <div
      css={css`
        display: flex;
        border-top: 1px solid ${palette.neutral[46]};
        &:focus-within {
          border-top-color: ${composer.primary[300]};
        }
        padding: ${space[2]}px;
      `}
    >
      <CreateItemInputBox
        payloadToBeSent={payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        message={message}
        setMessage={setMessage}
        sendItem={sendItem}
        allUsers={allUsers}
        addUnverifiedMention={addUnverifiedMention}
        panelElement={panelElement}
      />
      <button
        css={css`
          margin-left: ${space[2]}px;
          align-self: end;
          fill: ${composer.primary[300]};
          background: none;
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;

          ${buttonBackground(palette.neutral[86])}
          &:disabled {
            fill: ${palette.neutral[46]};
            background-color: initial;

            box-shadow: none;
            cursor: default;
          }
        `}
        onClick={() => sendItem()}
        disabled={!message && !payloadToBeSent}
      >
        <SendArrow
          css={css`
            width: 18px;
            height: 16px;
          `}
        />
      </button>
    </div>
  );
};
