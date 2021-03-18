/** @jsx jsx */
import React, { useEffect, useState } from "react";
import {
  ApolloError,
  useMutation,
  useQuery,
  useSubscription,
} from "@apollo/client";
import { Item, WorkflowStub } from "../../shared/graphql/graphql";
import { ScrollableItems } from "./scrollableItems";
import { HeadingPanel } from "./headingPanel";
import { css, jsx } from "@emotion/react";
import { WidgetProps } from "./widget";
import { space } from "@guardian/src-foundations";
import { PendingItem } from "./types/PendingItem";
import { gqlGetInitialItems, gqlCreateItem, gqlOnCreateItem } from "../gql";
import { CreateItemInputBox } from "./createItemInputBox";
import { pinMetal } from "../colours";
import { User } from "../../shared/User";

export type PinboardData = WorkflowStub;

interface PinboardProps extends WidgetProps {
  pinboardData: PinboardData;
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  setUnreadFlag: (pinboardId: string, hasUnread: boolean | undefined) => void;
  hasUnreadOnOtherPinboard: boolean;
  hasErrorOnOtherPinboard: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  clearSelectedPinboard: undefined | (() => void);
  allUsers: User[] | undefined;
}

export const Pinboard = ({
  user,
  allUsers,
  pinboardData,
  setError,
  setUnreadFlag,
  hasUnreadOnOtherPinboard,
  hasErrorOnOtherPinboard,
  isExpanded,
  isSelected,
  clearSelectedPinboard,
  payloadToBeSent,
  clearPayloadToBeSent,
}: PinboardProps) => {
  const [hasUnread, setHasUnread] = useState<boolean>();

  const [newMessage, setNewMessage] = useState<string>("");

  const pinboardId = pinboardData.id;

  // TODO: extract to widget level?
  const subscription = useSubscription(gqlOnCreateItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const updateForSubscription = subscriptionData.data.onCreateItem;
      setSubscriptionItems((prevState) => [
        ...prevState,
        updateForSubscription,
      ]);
      if (!isExpanded) {
        setHasUnread(true);
      }
    },
  });

  const [subscriptionItems, setSubscriptionItems] = useState<Item[]>([]);

  const [successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);

  const [sendItem] = useMutation<{ createItem: Item }>(gqlCreateItem, {
    onCompleted: (sendMessageResult) => {
      setSuccessfulSends((previousSends) => [
        ...previousSends,
        {
          ...sendMessageResult.createItem,
          pending: true,
        },
      ]);
      setNewMessage("");
      clearPayloadToBeSent();
    },
    onError: (error) => setError(pinboardId, error),
    variables: {
      input: {
        type: payloadToBeSent?.type || "message-only",
        message: newMessage,
        payload: payloadToBeSent && JSON.stringify(payloadToBeSent.payload),
        user: JSON.stringify(user),
        pinboardId,
      },
    },
  });

  const initialItems = useQuery(gqlGetInitialItems(pinboardId));

  useEffect(() => setUnreadFlag(pinboardId, hasUnread), [hasUnread]);

  useEffect(
    () => setError(pinboardId, initialItems.error || subscription.error),
    [initialItems.error, subscription.error]
  );

  return !isSelected ? null : (
    <React.Fragment>
      <div
        css={css`
          flex-grow: 1;
          color: black;
        `}
      >
        <HeadingPanel
          heading={pinboardData.title || ""}
          clearSelectedPinboard={clearSelectedPinboard}
          hasUnreadOnOtherPinboard={hasUnreadOnOtherPinboard}
          hasErrorOnOtherPinboard={hasErrorOnOtherPinboard}
        >
          {initialItems.loading && "Loading..."}
          {initialItems.error && `Error: ${initialItems.error}`}
          {subscription.error && `Error: ${subscription.error}`}
        </HeadingPanel>
      </div>
      {initialItems.data && (
        <ScrollableItems
          initialItems={initialItems.data.listItems.items}
          successfulSends={successfulSends}
          subscriptionItems={subscriptionItems}
          setHasUnread={setHasUnread}
          isExpanded={isExpanded}
          hasUnread={hasUnread}
        />
      )}
      <div
        css={css`
          display: flex;
          margin: ${space[1]}px;
        `}
      >
        <CreateItemInputBox
          payloadToBeSent={payloadToBeSent}
          clearPayloadToBeSent={clearPayloadToBeSent}
          message={newMessage}
          setMessage={setNewMessage}
          sendItem={sendItem}
          allUsers={allUsers}
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
          disabled={!newMessage && !payloadToBeSent}
        >
          Send
        </button>
      </div>
    </React.Fragment>
  );
};
