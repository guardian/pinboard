import { ApolloError, useMutation } from "@apollo/client";
import { css } from "@emotion/react";
import { space } from "@guardian/src-foundations";
import React, { useState } from "react";
import { Item, User } from "../../shared/graphql/graphql";
import { gqlCreateItem } from "../gql";
import { CreateItemInputBox } from "./createItemInputBox";
import { PayloadAndType } from "./types/PayloadAndType";
import { PendingItem } from "./types/PendingItem";
import { userToMentionHandle } from "./util";
import { pinMetal } from "../colours";

interface SendMessageAreaProps {
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  allUsers: User[] | undefined;
  onSuccessfulSend: (item: PendingItem) => void;
  onError: (error: ApolloError) => void;
  userEmail: string;
  pinboardId: string;
  floatyElement: HTMLDivElement | null;
}

export const SendMessageArea = ({
  payloadToBeSent,
  clearPayloadToBeSent,
  allUsers,
  onSuccessfulSend,
  onError,
  pinboardId,
  floatyElement,
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
        margin: ${space[1]}px;
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
        floatyElement={floatyElement}
      />
      <button
        css={css`
          margin-left: ${space[2]}px;
          color: ${pinMetal};
          background-color: #999999;
          padding: ${space[1]}px;
          :disabled {
            color: #999999;
            background-color: #dcdcdc;
            box-shadow: none;
          }
        `}
        onClick={() => sendItem()}
        disabled={!message && !payloadToBeSent}
      >
        Send
      </button>
    </div>
  );
};
