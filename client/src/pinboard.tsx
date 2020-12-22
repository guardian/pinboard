import React, { useState } from "react";
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  CreateItemInput,
  Item,
  WorkflowStub,
} from "../../shared/graphql/graphql";
import { Items } from "./items";
import { HeadingPanel } from "./headingPanel";
import { WidgetProps } from "./widget";

const bottomRight = 10;
const widgetSize = 50;
const boxShadow =
  "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";

const isEnterKey = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === "Enter" || event.keyCode === 13;

export type PinboardData = WorkflowStub;

interface PinboardProps extends WidgetProps {
  pinboardData: PinboardData;
}

export const Pinboard = ({ user, pinboardData }: PinboardProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [hasUnread, setHasUnread] = useState<boolean>();

  const [newMessage, setNewMessage] = useState<string>("");

  const pinboardId = pinboardData.id.toFixed(0);

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
      onError: console.error, // TODO add some better error handling
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

  return (
    <>
      <div
        style={{
          position: "fixed",
          zIndex: 99999,
          bottom: `${bottomRight}px`,
          right: `${bottomRight}px`,
          width: `${widgetSize}px`,
          height: `${widgetSize}px`,
          borderRadius: `${widgetSize / 2}px`,
          cursor: "pointer",
          background: "orange",
          boxShadow,
        }}
        onClick={() => setIsExpanded((previous) => !previous)}
      >
        <div
          style={{
            position: "absolute",
            fontSize: `${widgetSize / 2}px`,
            top: `${widgetSize / 4}px`,
            left: `${widgetSize / 4}px`,
            userSelect: "none",
          }}
        >
          📌
        </div>
        {(initialItems.error || subscription.error) && (
          <div
            style={{
              position: "absolute",
              fontSize: `${widgetSize / 3}px`,
              bottom: `-${widgetSize / 16}px`,
              right: `-${widgetSize / 16}px`,
              userSelect: "none",
              textShadow: "0 0 5px black",
            }}
          >
            ⚠️
          </div>
        )}
        {hasUnread && (
          <div
            style={{
              position: "absolute",
              fontSize: `${widgetSize / 3}px`,
              top: `-${widgetSize / 16}px`,
              userSelect: "none",
            }}
          >
            🔴
          </div>
        )}
      </div>
      <div
        style={{
          position: "fixed",
          zIndex: 99998,
          background: "white",
          boxShadow,
          border: "2px orange solid",
          width: "250px",
          height: "calc(100vh - 100px)",
          bottom: `${bottomRight + widgetSize / 2 - 5}px`,
          right: `${bottomRight + widgetSize / 2 - 5}px`,
          display: isExpanded ? "flex" : "none",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ flexGrow: 1 }}>
          <HeadingPanel heading={pinboardData.title || ""}>
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
          style={{
            display: "flex",
            margin: "5px",
          }}
        >
          <textarea
            style={{ flexGrow: 1, marginRight: "5px" }}
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
      </div>
    </>
  );
};
