import React, {useEffect, useState} from "react";
import {gql, useApolloClient, useMutation, useQuery, useSubscription} from "@apollo/client";
import {CreateItemInput, Item} from "../../shared/graphql/graphql";
import {Items} from "./items";
import {User} from "../../shared/User";

const bottomRight = 10;
const widgetSize = 50;
const boxShadow = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";

interface WidgetProps {
  user: User
}

export const Widget = ({user}: WidgetProps) => {

  const apolloClient = useApolloClient();

  const [isExpanded, setIsExpanded] = useState<boolean>();

  const [newMessage, setNewMessage] = useState<string>("");

  const onCreateItem =  /* GraphQL */ `
    subscription OnCreateItem(
      $id: ID
      $message: String
      $timestamp: AWSTimestamp
      $type: String
    )
    {
      onCreateItem(
        id: $id
        message: $message
        timestamp: $timestamp
        type: $type
      ) {
        id
        message
        timestamp
        type
      }
    }
  `

  useSubscription(gql`${onCreateItem}`, {
    onSubscriptionData: ({ subscriptionData }) => {
      setItems((prevState) => [...prevState, subscriptionData.data.onCreateItem])
    },    
  });

  const [ items, setItems ] = useState<Item[]>([]);

  const [sendMessage, sendMessageResult] = useMutation<CreateItemInput>(
    gql`mutation SendMessage($input: CreateItemInput!) {
      createItem(input: $input) { 
        # including values here makes them accessible in our subscription data
        id
        message
        user
        timestamp
      }
    }`, {
    onCompleted: () => setNewMessage(""),
    onError: console.error, // TODO add some better error handling,
    variables: {
      input: {
        type: "message",
        message: newMessage,
        user: JSON.stringify(user),
        timestamp: Date.now()
      }
    }
  });

  const initialItems = useQuery(gql`
    query MyQuery {
      listItems {
        items {
          id
          message
          timestamp
          type
          payload
          user
        }
      }
    }
  `, {
    onCompleted: (data) => setItems((prevState) => [
      ...data.listItems.items as Item[],
      ...prevState
    ].sort(
      // TODO sort server-side, perhaps when we add workflowID as a column for which we'll need a GSI (see https://github.com/awslabs/aws-mobile-appsync-sdk-js/issues/397#issuecomment-485994792
      (a, b) => a.timestamp - b.timestamp
    ))
  })

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
          borderRadius: `${widgetSize/2}px`,
          cursor: "pointer",
          background: "orange",
          boxShadow
        }}
        onClick={() => setIsExpanded(previous => !previous)}
      >
        <div style={{
          position: "absolute",
          fontSize: `${widgetSize/2}px`,
          top: `${widgetSize/4}px`,
          left: `${widgetSize/4}px`,
          userSelect: "none"
        }}>
          📌
        </div>
      </div>
      {isExpanded && (
        <div style={{
          position: "fixed",
          zIndex: 99998,
          background: "white",
          boxShadow,
          border: "2px orange solid",
          padding: "5px",
          width: "250px",
          height: "calc(100vh - 100px)",
          bottom: `${bottomRight + (widgetSize/2) - 5}px`,
          right: `${bottomRight + (widgetSize/2) - 5}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          {initialItems.loading && "Loading..."}
          {initialItems.error && `Error: ${initialItems.error}`}
          {initialItems.data && <Items items={items} />}
          <div style={{
            display: "flex"
          }}>
            <textarea
              style={{flexGrow: 1, marginRight: "5px"}}
              placeholder="enter chat message here..."
              rows={2}
              value={newMessage}
              onChange={event => setNewMessage(event.target.value)}
            />
            <button className="btn" onClick={() => sendMessage()}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}
