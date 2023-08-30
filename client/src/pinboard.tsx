import React, { useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { Claimed, Item, LastItemSeenByUser } from "shared/graphql/graphql";
import { ScrollableItems } from "./scrollableItems";
import { PendingItem } from "./types/PendingItem";
import {
  gqlClaimItem,
  gqlGetInitialItems,
  gqlGetLastItemSeenByUsers,
  gqlOnClaimItem,
  gqlOnMutateItem,
  gqlOnSeenItem,
} from "../gql";
import { SendMessageArea } from "./sendMessageArea";
import { useGlobalStateContext } from "./globalState";
import { css } from "@emotion/react";
import { AssetView } from "./assetView";
import { Feedback } from "./feedback";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";
import { ModalBackground } from "./modal";
import { maybeConstructPayloadAndType } from "./types/PayloadAndType";
import { useTourProgress, useTourStepRef } from "./tour/tourState";
import { Reply } from "./reply";
export interface ItemsMap {
  [id: string]: Item | PendingItem;
}

export interface LastItemSeenByUserLookup {
  [userEmail: string]: LastItemSeenByUser;
}

interface PinboardProps {
  pinboardId: string;
  composerId: string | null;
  isExpanded: boolean;
  isSelected: boolean;
  panelElement: HTMLDivElement | null;
  setMaybeInlineSelectedPinboardId: (pinboardId: string | null) => void;
}

export const Pinboard = ({
  pinboardId,
  composerId,
  isExpanded,
  isSelected,
  panelElement,
  setMaybeInlineSelectedPinboardId,
}: PinboardProps) => {
  const {
    hasBrowserFocus,

    activeTab,
    userEmail,
    userLookup,
    addEmailsToLookup,

    payloadToBeSent,
    setPayloadToBeSent,
    clearPayloadToBeSent,

    showNotification,

    setError,

    unreadFlags,
    setUnreadFlag,

    addManuallyOpenedPinboardId,
  } = useGlobalStateContext();

  const sendTelemetryEvent = useContext(TelemetryContext);

  const tourProgress = useTourProgress();

  const itemSubscription = useSubscription(gqlOnMutateItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const itemFromSubscription: Item = subscriptionData.data.onMutateItem;
      addEmailsToLookup([itemFromSubscription.userEmail]);
      setSubscriptionItems((prevState) => [...prevState, itemFromSubscription]);
      if (!isExpanded && !itemFromSubscription.editHistory) {
        showNotification(itemFromSubscription);
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  const claimSubscription = useSubscription(gqlOnClaimItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const { updatedItem, newItem }: Claimed =
        subscriptionData.data.onClaimItem;
      addEmailsToLookup([newItem.userEmail]);
      setClaimItems((prevState) => [...prevState, updatedItem, newItem]);
      if (!isExpanded) {
        showNotification(newItem);
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  const [claimItems, setClaimItems] = useState<Item[]>([]);

  const [_subscriptionItems, setSubscriptionItems] = useState<Item[]>([]);
  const subscriptionItems = tourProgress.isRunning
    ? tourProgress.subscriptionItems
    : _subscriptionItems;

  const [_successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);
  const successfulSends = tourProgress.isRunning
    ? tourProgress.successfulSends
    : _successfulSends;

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
      Object.values(itemsMap).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
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

  const [_lastItemSeenByUserLookup, setLastItemSeenByUserLookup] =
    useState<LastItemSeenByUserLookup>({});
  const lastItemSeenByUserLookup = tourProgress.isRunning
    ? tourProgress.lastItemSeenByUserLookup
    : _lastItemSeenByUserLookup;

  useSubscription(gqlOnSeenItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const newLastItemSeenByUser: LastItemSeenByUser =
        subscriptionData.data.onSeenItem;
      addEmailsToLookup([newLastItemSeenByUser.userEmail]);
      const previousLastItemSeenByUser =
        _lastItemSeenByUserLookup[newLastItemSeenByUser.userEmail];
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
      initialLastItemSeenByUsersQuery.data?.listLastItemSeenByUsers &&
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

  const onSuccessfulSend = (
    pendingItem: PendingItem,
    mentionEmails: string[]
  ) => {
    setSuccessfulSends((previousSends) => [...previousSends, pendingItem]);

    const tourIsRunning = tourProgress.isRunning;

    if (!tourIsRunning) {
      // ensure any pinboard you contribute to ends up on your list of manually opened pinboards
      addManuallyOpenedPinboardId(tourIsRunning)(pendingItem.pinboardId);

      // ensure any pinboard you're mentioned on ends up on your list of manually opened pinboards
      mentionEmails.map((mentionEmail) =>
        addManuallyOpenedPinboardId(tourIsRunning)(
          pendingItem.pinboardId,
          mentionEmail
        )
      );
    }
  };

  const handleClaimed = (data: { claimItem: Claimed }) => {
    setClaimItems((prevState) => [
      ...prevState,
      data.claimItem.updatedItem,
      data.claimItem.newItem,
    ]);
    !tourProgress.isRunning &&
      addManuallyOpenedPinboardId(tourProgress.isRunning)(
        data.claimItem.pinboardId
      );
    const unclaimedDurationInMillis =
      new Date(data.claimItem.newItem.timestamp).getTime() -
      new Date(data.claimItem.updatedItem.timestamp).getTime();
    sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.CLAIMED_ITEM, {
      pinboardId: data.claimItem.pinboardId,
      unclaimedDurationInMillis,
    });
  };

  const [claimItem] = useMutation(gqlClaimItem, {
    onCompleted: handleClaimed,
  });

  // FIXME add a GraphQL subscription to hear about claims performed by other people (reusing handleClaimed)

  const [hasProcessedItemIdInURL, setHasProcessedItemIdInURL] = useState(false);

  const [maybeEditingItemId, setMaybeEditingItemId] = useState<string | null>(
    null
  );

  const maybeEditingItem = useMemo(
    () => maybeEditingItemId && itemsMap[maybeEditingItemId],
    [maybeEditingItemId]
  );

  useEffect(() => {
    if (maybeEditingItem) {
      const previousPayloadToBeSent = payloadToBeSent;
      setPayloadToBeSent(
        maybeConstructPayloadAndType(
          maybeEditingItem.type,
          maybeEditingItem.payload
        ) || null
      );
      return () => {
        setPayloadToBeSent(previousPayloadToBeSent);
      };
    }
  }, [maybeEditingItemId]);

  const [maybeReplyingToItemId, setMaybeReplyingToItemId] = useState<
    string | null
  >(null);
  const clearMaybeReplyingToItemId = () => setMaybeReplyingToItemId(null);

  const [maybeDeleteItemModalElement, setMaybeDeleteItemModalElement] =
    useState<JSX.Element | null>(null);

  const maybeReplyingToItem =
    (maybeReplyingToItemId && itemsMap[maybeReplyingToItemId]) || null;
  const maybeReplyingToElement = useMemo(
    () =>
      maybeReplyingToItem && (
        <Reply
          item={maybeReplyingToItem}
          maybeUser={userLookup[maybeReplyingToItem.userEmail]}
          clearMaybeReplyingToItemId={() => setMaybeReplyingToItemId(null)}
        />
      ),
    [maybeReplyingToItemId]
  );

  return !isSelected ? null : (
    <React.Fragment>
      <div>{maybeDeleteItemModalElement}</div>
      <div>{maybeEditingItemId && <ModalBackground />}</div>
      <div ref={useTourStepRef("feedback")}>
        <Feedback
          setMaybeInlineSelectedPinboardId={setMaybeInlineSelectedPinboardId}
        />
      </div>
      {initialItemsQuery.loading && "Loading..."}
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
          hasBrowserFocus={hasBrowserFocus}
          isExpanded={isExpanded}
          userLookup={userLookup}
          userEmail={userEmail}
          pinboardId={pinboardId}
          lastItemSeenByUserLookup={lastItemSeenByUserLookup}
          claimItem={claimItem}
          hasProcessedItemIdInURL={hasProcessedItemIdInURL}
          setHasProcessedItemIdInURL={setHasProcessedItemIdInURL}
          setMaybeDeleteItemModalElement={setMaybeDeleteItemModalElement}
          maybeEditingItemId={maybeEditingItemId}
          setMaybeEditingItemId={setMaybeEditingItemId}
          setMaybeReplyingToItemId={setMaybeReplyingToItemId}
        />
      )}
      {activeTab === "asset" && initialItemsQuery.data && (
        <AssetView items={items} />
      )}
      {activeTab === "chat" && (
        <div
          ref={useTourStepRef(
            "messaging",
            "requests",
            "sharingGridAssets",
            "workflow"
          )}
        >
          <SendMessageArea
            onSuccessfulSend={onSuccessfulSend}
            payloadToBeSent={maybeEditingItemId ? null : payloadToBeSent}
            setPayloadToBeSent={setPayloadToBeSent}
            clearPayloadToBeSent={clearPayloadToBeSent}
            onError={(error) => setError(pinboardId, error)}
            userEmail={userEmail}
            pinboardId={pinboardId}
            composerId={composerId}
            panelElement={panelElement}
            maybeReplyingToItemId={maybeReplyingToItemId}
            maybeReplyingToElement={maybeReplyingToElement}
            clearReplyingToItemId={clearMaybeReplyingToItemId}
          />
        </div>
      )}
    </React.Fragment>
  );
};
