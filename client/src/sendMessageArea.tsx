import { ApolloError, useLazyQuery, useMutation } from "@apollo/client";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React, { useContext, useState } from "react";
import { CreateItemInput, Group, Item, User } from "shared/graphql/graphql";
import { gqlAsGridPayload, gqlCreateItem } from "../gql";
import { ItemInputBox } from "./itemInputBox";
import { PayloadAndType } from "./types/PayloadAndType";
import { PendingItem } from "./types/PendingItem";
import { composer } from "../colours";
import SendArrow from "../icons/send.svg";
import { buttonBackground } from "./styling";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";
import { SvgSpinner } from "@guardian/source-react-components";
import { isGroup, isUser } from "shared/graphql/extraTypes";
import { useConfirmModal } from "./modal";
import { groupToMentionHandle, userToMentionHandle } from "./mentionsUtil";
import { useTourProgress } from "./tour/tourState";
import { demoPinboardData } from "./tour/tourConstants";

interface SendMessageAreaProps {
  payloadToBeSent: PayloadAndType | null;
  setPayloadToBeSent: (payload: PayloadAndType | null) => void;
  clearPayloadToBeSent: () => void;
  onSuccessfulSend: (item: PendingItem, mentionEmails: string[]) => void;
  onError: (error: ApolloError) => void;
  userEmail: string;
  pinboardId: string;
  composerId: string | null;
  panelElement: HTMLDivElement | null;
  maybeReplyingToItemId: string | null;
  maybeReplyingToElement: JSX.Element | null;
  clearReplyingToItemId: () => void;
}

export const SendMessageArea = ({
  payloadToBeSent,
  setPayloadToBeSent,
  clearPayloadToBeSent,
  onSuccessfulSend,
  onError,
  pinboardId,
  composerId,
  panelElement,
  maybeReplyingToItemId,
  maybeReplyingToElement,
  clearReplyingToItemId,
}: SendMessageAreaProps) => {
  const [message, setMessage] = useState<string>("");
  const [unverifiedMentions, setUnverifiedMentions] = useState<
    Array<User | Group>
  >([]);
  const addUnverifiedMention = (userOrGroup: User | Group) =>
    setUnverifiedMentions((prevState) => [...prevState, userOrGroup]); // TODO: also make user unique in list

  const verifiedIndividualMentionEmails = Array.from(
    new Set(
      unverifiedMentions
        .filter(isUser)
        .filter((user) => message.includes(userToMentionHandle(user)))
        .map((user) => user.email)
    )
  );

  const verifiedGroupMentionShorthands = Array.from(
    new Set(
      unverifiedMentions
        .filter(isGroup)
        .filter((group) => message.includes(groupToMentionHandle(group)))
        .map((group) => group.shorthand)
    )
  );

  const sendTelemetryEvent = useContext(TelemetryContext);

  const [_sendItem, { loading: isItemSending }] = useMutation<{
    createItem: Item;
  }>(gqlCreateItem, {
    onCompleted: (sendMessageResult) => {
      onSuccessfulSend(
        {
          ...sendMessageResult.createItem,
          pending: true,
        },
        verifiedIndividualMentionEmails
      );
      sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.MESSAGE_SENT, {
        pinboardId: sendMessageResult.createItem.pinboardId,
        messageType: payloadToBeSent?.type || "message-only",
        hasMentions:
          !!verifiedIndividualMentionEmails.length ||
          !!verifiedGroupMentionShorthands.length,
        hasIndividualMentions: !!verifiedIndividualMentionEmails.length,
        hasGroupMentions: !!verifiedGroupMentionShorthands.length,
        isClaimable: sendMessageResult.createItem.claimable,
        isReply: !!sendMessageResult.createItem.relatedItemId,
        ...(composerId ? { composerId } : {}),
      });
      setMessage("");
      clearPayloadToBeSent();
      clearReplyingToItemId();
      setUnverifiedMentions([]);
    },
    onError,
  });

  const [claimableConfirmModalElement, confirmClaimable] = useConfirmModal(
    <React.Fragment>
      <div
        css={css`
          font-weight: bold;
        `}
      >
        You are mentioning a group.
        <br />
        Would you like to make this a request?
      </div>
      <div>
        They will be able to confirm who in the team is responsible for your
        request.
      </div>
    </React.Fragment>
  );

  const tourProgress = useTourProgress();

  const sendItem = () =>
    confirmClaimable(verifiedGroupMentionShorthands?.length > 0).then(
      (claimable) => {
        const messageItem = {
          variables: {
            input: {
              type: payloadToBeSent?.type || "message-only",
              message,
              payload:
                payloadToBeSent && JSON.stringify(payloadToBeSent.payload),
              pinboardId,
              mentions: verifiedIndividualMentionEmails,
              groupMentions: verifiedGroupMentionShorthands,
              claimable,
              relatedItemId: maybeReplyingToItemId,
            } satisfies CreateItemInput,
          },
        };
        if (tourProgress.isRunning) {
          sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.INTERACTIVE_TOUR, {
            tourEvent: "messaging",
          });
          tourProgress.sendItem(() => {
            setMessage("");
            clearPayloadToBeSent();
            clearReplyingToItemId();
            setUnverifiedMentions([]);
          })(messageItem);
        } else if (
          messageItem.variables.input.pinboardId === demoPinboardData.id
        ) {
          throw new Error(
            "Demo/Tour NOT running, but message send attempt on 'demo' pinboard"
          );
        } else {
          _sendItem(messageItem);
        }
      }
    );

  const [asGridPayload, { loading: isAsGridPayloadLoading }] = useLazyQuery<{
    asGridPayload: string | null;
  }>(gqlAsGridPayload);

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
      {claimableConfirmModalElement}
      <ItemInputBox
        payloadToBeSent={payloadToBeSent}
        setPayloadToBeSent={setPayloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        message={message}
        setMessage={setMessage}
        sendItem={sendItem}
        addUnverifiedMention={addUnverifiedMention}
        panelElement={panelElement}
        isSending={isItemSending}
        asGridPayload={asGridPayload}
        isAsGridPayloadLoading={isAsGridPayloadLoading}
        maybeReplyingToElement={maybeReplyingToElement}
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
        onClick={sendItem}
        disabled={
          isItemSending ||
          isAsGridPayloadLoading ||
          !(message?.trim() || payloadToBeSent)
        }
      >
        {isItemSending ? (
          <SvgSpinner />
        ) : (
          <SendArrow
            css={css`
              width: 18px;
              height: 16px;
            `}
          />
        )}
      </button>
    </div>
  );
};
