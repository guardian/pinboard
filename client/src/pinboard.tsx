/** @jsx jsx */
import React, { useEffect, useState } from "react";
import { ApolloError, useQuery, useSubscription } from "@apollo/client";
import { Item, User, WorkflowStub } from "../../shared/graphql/graphql";
import { ScrollableItems } from "./scrollableItems";
import { HeadingPanel } from "./headingPanel";
import { css, jsx } from "@emotion/react";
import { WidgetProps } from "./widget";
import { PendingItem } from "./types/PendingItem";
import { gqlGetInitialItems, gqlOnCreateItem } from "../gql";
import { SendMessageArea } from "./sendMessageArea";

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
  userLookup: { [email: string]: User } | undefined;
}

export const Pinboard = ({
  userEmail,
  allUsers,
  userLookup,
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
          userLookup={userLookup}
          userEmail={userEmail}
        />
      )}
      <SendMessageArea
        onSuccessfulSend={(pendingItem) =>
          setSuccessfulSends((previousSends) => [...previousSends, pendingItem])
        }
        payloadToBeSent={payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
        allUsers={allUsers}
        onError={(error) => setError(pinboardId, error)}
        userEmail={userEmail}
        pinboardId={pinboardId}
      />
    </React.Fragment>
  );
};
