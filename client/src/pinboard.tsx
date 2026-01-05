import React, { useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Claimed, Item, LastItemSeenByUser } from "shared/graphql/graphql";
import { ScrollableItems } from "./scrollableItems";
import { PendingItem } from "./types/PendingItem";
import {
  gqlClaimItem,
  gqlGetInitialItems,
  gqlGetLastItemSeenByUsers,
} from "../gql";
import { SendMessageArea } from "./sendMessageArea";
import { useGlobalStateContext } from "./globalState";
import { css } from "@emotion/react";
import { AssetView } from "./assetView";
import { Feedback } from "./feedback";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";
import { ModalBackground } from "./modal";
import {
  maybeConstructPayloadAndType,
  PayloadWithThumbnail,
} from "./types/PayloadAndType";
import { useTourProgress, useTourStepRef } from "./tour/tourState";
import { Reply } from "./reply";
import { isPinboardData } from "shared/graphql/extraTypes";
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

    preselectedPinboard,
    setCropsOnPreselectedPinboard,

    showNotification,

    setError,

    unreadFlags,
    setUnreadFlag,

    addManuallyOpenedPinboardId,

    allSubscriptionItems,
    allSubscriptionClaimedItems,
    allSubscriptionOnSeenItems,
  } = useGlobalStateContext();

  const sendTelemetryEvent = useContext(TelemetryContext);

  const tourProgress = useTourProgress();

  const relevantSubscriptionItems = useMemo(
    () => allSubscriptionItems.filter((_) => _.pinboardId === pinboardId),
    [allSubscriptionItems]
  );
  const relevantSubscriptionClaimedItems = useMemo(
    () =>
      allSubscriptionClaimedItems.filter((_) => _.pinboardId === pinboardId),
    [allSubscriptionClaimedItems]
  );
  const relevantSubscriptionOnSeenItems = useMemo(
    () => allSubscriptionOnSeenItems.filter((_) => _.pinboardId === pinboardId),
    [allSubscriptionOnSeenItems]
  );

  const subscriptionItems = useMemo(
    () =>
      tourProgress.isRunning
        ? tourProgress.subscriptionItems
        : relevantSubscriptionItems.filter((_) => _.pinboardId === pinboardId),
    [
      relevantSubscriptionItems,
      tourProgress.subscriptionItems,
      tourProgress.isRunning,
    ]
  );

  const [_successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);
  const successfulSends = tourProgress.isRunning
    ? tourProgress.successfulSends
    : _successfulSends;

  const initialItemsQuery = useQuery(gqlGetInitialItems, {
    variables: { pinboardId },
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
        ...relevantSubscriptionClaimedItems,
      ].reduce(
        (accumulator, item) => ({
          ...accumulator,
          [item.id]: item,
        }),
        {} as ItemsMap
      ),
    [
      initialItemsQuery.data,
      successfulSends,
      subscriptionItems,
      relevantSubscriptionClaimedItems,
    ]
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

  useEffect(() => {
    isPinboardData(preselectedPinboard) &&
      preselectedPinboard.id === pinboardId &&
      setCropsOnPreselectedPinboard(
        items.reduce(
          (acc, item) =>
            item.type === "grid-crop" && item.payload
              ? [...acc, [JSON.parse(item.payload), item]]
              : acc,
          [] as Array<[PayloadWithThumbnail, Item]>
        )
      );
  }, [preselectedPinboard, items]);

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

  useEffect(() => {
    setLastItemSeenByUserLookup((prevState) =>
      relevantSubscriptionOnSeenItems.reduce((acc, lastItemSeenByUser) => {
        const previousLastItemSeenByUser = acc[lastItemSeenByUser.userEmail];
        if (
          !previousLastItemSeenByUser ||
          previousLastItemSeenByUser.seenAt < lastItemSeenByUser.seenAt
        ) {
          return {
            ...acc,
            [lastItemSeenByUser.userEmail]: lastItemSeenByUser,
          };
        } else {
          return acc;
        }
      }, prevState)
    );
  }, [relevantSubscriptionOnSeenItems]);

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
    () => setError(pinboardId, initialItemsQuery.error),
    [initialItemsQuery.error]
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

  const [claimItem] = useMutation(gqlClaimItem, {
    onCompleted: (data: { claimItem: Claimed }) => {
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
    },
  });

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

  const [maybeItemModalElement, setMaybeItemModalElement] =
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
      <div>{maybeItemModalElement}</div>
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
          setMaybeItemModalElement={setMaybeItemModalElement}
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
