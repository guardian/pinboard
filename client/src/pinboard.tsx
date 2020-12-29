/** @jsx jsx */
import React, { useEffect, useState } from "react";
import {
  ApolloError,
  gql,
  useMutation,
  useQuery,
  useSubscription,
} from "@apollo/client";
import {
  CreateItemInput,
  Item,
  WorkflowStub,
} from "../../shared/graphql/graphql";
import { Items } from "./items";
import { HeadingPanel } from "./headingPanel";
import { WidgetProps } from "./widget";
import { css, jsx } from "@emotion/react";

const isEnterKey = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === "Enter" || event.keyCode === 13;

export type PinboardData = WorkflowStub;

interface PinboardProps extends WidgetProps {
  pinboardData: PinboardData;
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  setUnreadFlag: (pinboardId: string, hasUnread: boolean | undefined) => void;
  isExpanded: boolean;
  isSelected: boolean;
  clearSelectedPinboard: () => void;
}

export const Pinboard = ({
  user,
  pinboardData,
  setError,
  setUnreadFlag,
  isExpanded,
  isSelected,
  clearSelectedPinboard,
}: PinboardProps) => {
  const [hasUnread, setHasUnread] = useState<boolean>();

  const [newMessage, setNewMessage] = useState<string>("");

  const pinboardId = pinboardData.id;

  const onCreateItem = gql`
    subscription OnCreateItem {
      onCreateItem(
        pinboardId: "${pinboardId}"
      ) {
        id
        message
        timestamp
        type
        pinboardId
      }
    }
  `;

  // TODO: extract to widget level?
  const subscription = useSubscription(onCreateItem, {
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

  const [
    sendMessage /*, sendMessageResult TODO do something with the result */,
  ] = useMutation<CreateItemInput>(
    gql`
      mutation SendMessage($input: CreateItemInput!) {
        createItem(input: $input) {
          # including fields here makes them accessible in our subscription data
          id
          message
          user
          timestamp
          pinboardId
        }
      }
    `,
    {
      onCompleted: () => setNewMessage(""),
      onError: (error) => setError(pinboardId, error),
      variables: {
        input: {
          type: "message",
          message: newMessage,
          user: JSON.stringify(user),
          pinboardId,
        },
      },
    }
  );

  // TODO: consider updating the resolver (cdk/stack.ts) to use a Query with a secondary index (if performance degrades when we have lots of items)
  const initialItems = useQuery(
    gql`
      query MyQuery {
        listItems(filter: { pinboardId: { eq: "${pinboardId}" } }) {
          items {
            id
            message
            timestamp
            type
            payload
            user
            pinboardId
          }
        }
      }
    `
  );

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
        `}
      >
        <HeadingPanel
          heading={pinboardData.title || ""}
          clearSelectedPinboard={clearSelectedPinboard}
        >
          {initialItems.loading && "Loading..."}
          {initialItems.error && `Error: ${initialItems.error}`}
          {subscription.error && `Error: ${subscription.error}`}
        </HeadingPanel>
      </div>
      {initialItems.data && (
        <Items
          initialItems={initialItems.data.listItems.items}
          subscriptionItems={subscriptionItems}
          setHasUnread={setHasUnread}
          isExpanded={isExpanded}
        />
      )}
      <div
        css={css`
          display: "flex";
          margin: 5px;
        `}
      >
        <textarea
          css={css`
            flex-grow: 1;
            margin-right: 5px;
          `}
          placeholder="enter chat message here..."
          rows={2}
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          onKeyPress={(event) =>
            isEnterKey(event) &&
            newMessage &&
            sendMessage() &&
            event.preventDefault()
          }
        />
        <button
          className="btn"
          onClick={() => sendMessage()}
          disabled={!newMessage}
        >
          Send
        </button>
      </div>
    </React.Fragment>
  );
};
