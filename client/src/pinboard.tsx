import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  Claimed,
  Item,
  LastItemSeenByUser,
} from "../../shared/graphql/graphql";
import { ScrollableItems } from "./scrollableItems";
import { PendingItem } from "./types/PendingItem";
import {
  gqlClaimItem,
  gqlGetInitialItems,
  gqlGetLastItemSeenByUsers,
  gqlOnClaimItem,
  gqlOnCreateItem,
  gqlOnSeenItem,
} from "../gql";
import { SendMessageArea } from "./sendMessageArea";
import { useGlobalStateContext } from "./globalState";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { composer } from "../colours";
import { SvgAlertTriangle } from "@guardian/source-react-components";
import { agateSans } from "../fontNormaliser";
import { bottom, floatySize, panelCornerSize, right } from "./styling";
import { AssetView } from "./assetView";
import { Feedback } from "./feedback";

export interface ItemsMap {
  [id: string]: Item | PendingItem;
}

export interface LastItemSeenByUserLookup {
  [userEmail: string]: LastItemSeenByUser;
}

interface PinboardProps {
  pinboardId: string;
  isExpanded: boolean;
  isSelected: boolean;
  panelElement: HTMLDivElement | null;
}

export const Pinboard: React.FC<PinboardProps> = ({
  pinboardId,
  isExpanded,
  isSelected,
  panelElement,
}) => {
  const {
    activeTab,
    userEmail,
    userLookup,
    addEmailsToLookup,

    payloadToBeSent,
    clearPayloadToBeSent,

    showNotification,

    errors,
    setError,

    unreadFlags,
    setUnreadFlag,

    addManuallyOpenedPinboardId,
  } = useGlobalStateContext();

  const itemSubscription = useSubscription(gqlOnCreateItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const itemFromSubscription: Item = subscriptionData.data.onCreateItem;
      addEmailsToLookup([itemFromSubscription.userEmail]);
      setSubscriptionItems((prevState) => [...prevState, itemFromSubscription]);
      if (!isExpanded) {
        showNotification(itemFromSubscription);
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  const claimSubscription = useSubscription(gqlOnClaimItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const {
        updatedItem,
        newItem,
      }: Claimed = subscriptionData.data.onClaimItem;
      addEmailsToLookup([newItem.userEmail]);
      setClaimItems((prevState) => [...prevState, updatedItem, newItem]);
      if (!isExpanded) {
        showNotification(newItem);
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  const [claimItems, setClaimItems] = useState<Item[]>([]);

  const [subscriptionItems, setSubscriptionItems] = useState<Item[]>([]);

  const [successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);

  const initialItemsQuery = useQuery(gqlGetInitialItems(pinboardId), {
    onCompleted: (data) => {
      addEmailsToLookup(
        data.listItems?.map((item: Item) => item.userEmail) || []
      );
    },
  });

  const itemsMap: ItemsMap = useMemo(
    () =>
      [
        ...(initialItemsQuery.data?.listItems || []),
        ...successfulSends,
        ...subscriptionItems, // any subscription items with same ids as 'successfulSends' will override (and therefore pending:true will be gone)
        ...claimItems,
      ].reduce(
        (accumulator, item) => ({
          ...accumulator,
          [item.id]: item,
        }),
        {} as ItemsMap
      ),
    [initialItemsQuery.data, successfulSends, subscriptionItems, claimItems]
  );

  const items: Array<PendingItem | Item> = useMemo(
    () =>
      Object.values(itemsMap)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .filter(
          (item, index, items) =>
            item.type !== "claim" ||
            !item.relatedItemId ||
            items[index - 1]?.id !== item.relatedItemId
        ),
    [itemsMap]
  );

  const lastItemIndex = items.length - 1;
  const lastItem = items[lastItemIndex];

  const initialLastItemSeenByUsersQuery = useQuery(
    gqlGetLastItemSeenByUsers(pinboardId),
    {
      onCompleted: (data) => {
        addEmailsToLookup(
          data.listLastItemSeenByUsers?.map(
            (lastItemSeenByUser: LastItemSeenByUser) =>
              lastItemSeenByUser.userEmail
          ) || []
        );
      },
    }
  );

  const [
    lastItemSeenByUserLookup,
    setLastItemSeenByUserLookup,
  ] = useState<LastItemSeenByUserLookup>({});

  useSubscription(gqlOnSeenItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const newLastItemSeenByUser: LastItemSeenByUser =
        subscriptionData.data.onSeenItem;
      addEmailsToLookup([newLastItemSeenByUser.userEmail]);
      const previousLastItemSeenByUser =
        lastItemSeenByUserLookup[newLastItemSeenByUser.userEmail];
      if (
        !previousLastItemSeenByUser ||
        previousLastItemSeenByUser.seenAt < newLastItemSeenByUser.seenAt
      ) {
        setLastItemSeenByUserLookup((prevState) => ({
          ...prevState,
          [newLastItemSeenByUser.userEmail]: newLastItemSeenByUser,
        }));
      }
    },
  });

  useEffect(
    () =>
      initialLastItemSeenByUsersQuery.data &&
      setLastItemSeenByUserLookup((prevState) =>
        initialLastItemSeenByUsersQuery.data.listLastItemSeenByUsers.reduce(
          (
            acc: LastItemSeenByUserLookup,
            newLastItemSeenByUser: LastItemSeenByUser
          ) => {
            const previousLastItemSeenByUser =
              acc[newLastItemSeenByUser.userEmail];
            if (
              !previousLastItemSeenByUser ||
              previousLastItemSeenByUser.seenAt < newLastItemSeenByUser.seenAt
            ) {
              return {
                ...acc,
                [newLastItemSeenByUser.userEmail]: newLastItemSeenByUser,
              };
            }
            return acc;
          },
          prevState
        )
      ),
    [initialLastItemSeenByUsersQuery.data]
  );

  const hasUnread = unreadFlags[pinboardId];
  useEffect(() => {
    if (initialLastItemSeenByUsersQuery.data && items && items.length > 0) {
      const lastItemSeenByUser = lastItemSeenByUserLookup[userEmail];
      setUnreadFlag(pinboardId)(
        lastItem && lastItem.id !== lastItemSeenByUser?.itemID
      );
    }
  }, [lastItem, lastItemSeenByUserLookup]);

  useEffect(
    () =>
      setError(
        pinboardId,
        initialItemsQuery.error ||
          itemSubscription.error ||
          claimSubscription.error
      ),
    [initialItemsQuery.error, itemSubscription.error, claimSubscription.error]
  );
  const hasError = !!errors[pinboardId];

  const onSuccessfulSend = (
    pendingItem: PendingItem,
    mentionEmails: string[]
  ) => {
    setSuccessfulSends((previousSends) => [...previousSends, pendingItem]);

    // ensure any pinboard you contribute to ends up on your list of manually opened pinboards
    addManuallyOpenedPinboardId(pendingItem.pinboardId);

    // ensure any pinboard you're mentioned on ends up on your list of manually opened pinboards
    mentionEmails.map((mentionEmail) =>
      addManuallyOpenedPinboardId(pendingItem.pinboardId, mentionEmail)
    );
  };

  const handleClaimed = (data: { claimItem: Claimed }) => {
    setClaimItems((prevState) => [
      ...prevState,
      data.claimItem.updatedItem,
      data.claimItem.newItem,
    ]);
    addManuallyOpenedPinboardId(data.claimItem.pinboardId);
  };

  const [claimItem] = useMutation(gqlClaimItem, {
    onCompleted: handleClaimed,
  });

  // FIXME add a GraphQL subscription to hear about claims performed by other people (reusing handleClaimed)

  const [hasProcessedItemIdInURL, setHasProcessedItemIdInURL] = useState(false);

  return !isSelected ? null : (
    <React.Fragment>
      <Feedback />
      {initialItemsQuery.loading && "Loading..."}
      {hasError && (
        <div
          css={css`
            position: absolute;
            top: 58px;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 98;
            border-top-left-radius: ${space[1]}px;
            border-top-right-radius: ${space[1]}px;
            background-color: rgba(255, 255, 255, 0.35);
            &::after {
              content: "";
              position: fixed;
              background: rgba(255, 255, 255, 0.35);
              width: ${panelCornerSize}px;
              height: ${panelCornerSize}px;
              bottom: ${bottom + floatySize + space[2]}px;
              right: ${right + floatySize / 2}px;
              border-bottom-left-radius: ${panelCornerSize}px;
            }
          `}
        >
          <div
            css={css`
              background-color: ${composer.warning[100]};
              color: ${palette.neutral[100]};
              ${agateSans.xsmall({ lineHeight: "tight", fontWeight: "bold" })}
              padding: ${space[2]}px;
              border-radius: ${space[1]}px;
              margin: ${space[2]}px;
              position: relative;
              top: 0;
              z-index: 99;
            `}
          >
            <div
              css={css`
                display: flex;
                align-items: center;
                column-gap: ${space[2]}px;
              `}
            >
              <div
                css={css`
                  fill: ${palette.neutral[100]};
                `}
              >
                <SvgAlertTriangle size="small" />
              </div>
              <div>
                There has been an error. You may need to refresh the page to
                allow pinboard to reconnect. Make sure to save your work first!
              </div>
            </div>
          </div>
        </div>
      )}
      <div // push chat messages to bottom of panel if they do not fill
        css={css`
          flex-grow: 1;
        `}
      />
      {activeTab === "chat" && initialItemsQuery.data && (
        <ScrollableItems
          showNotification={showNotification}
          items={items}
          itemsMap={itemsMap}
          successfulSends={successfulSends}
          subscriptionItems={subscriptionItems}
          maybeLastItem={lastItem}
          hasUnread={hasUnread}
          isExpanded={isExpanded}
          userLookup={userLookup}
          userEmail={userEmail}
          pinboardId={pinboardId}
          lastItemSeenByUserLookup={lastItemSeenByUserLookup}
          claimItem={claimItem}
          hasProcessedItemIdInURL={hasProcessedItemIdInURL}
          setHasProcessedItemIdInURL={setHasProcessedItemIdInURL}
        />
      )}
      {activeTab === "asset" && initialItemsQuery.data && (
        <AssetView items={items} />
      )}
      {activeTab === "chat" && (
        <SendMessageArea
          onSuccessfulSend={onSuccessfulSend}
          payloadToBeSent={payloadToBeSent}
          clearPayloadToBeSent={clearPayloadToBeSent}
          onError={(error) => setError(pinboardId, error)}
          userEmail={userEmail}
          pinboardId={pinboardId}
          panelElement={panelElement}
        />
      )}
    </React.Fragment>
  );
};
