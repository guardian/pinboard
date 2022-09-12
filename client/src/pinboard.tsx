import React, { useEffect, useState } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import { Item, LastItemSeenByUser } from "../../shared/graphql/graphql";
import { ScrollableItems } from "./scrollableItems";
import { PendingItem } from "./types/PendingItem";
import {
  gqlGetInitialItems,
  gqlGetLastItemSeenByUsers,
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

    payloadToBeSent,
    clearPayloadToBeSent,

    showNotification,

    errors,
    setError,

    setUnreadFlag,

    addManuallyOpenedPinboardId,
  } = useGlobalStateContext();

  // TODO: extract to floaty level?
  const itemSubscription = useSubscription(gqlOnCreateItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const updateForSubscription = subscriptionData.data.onCreateItem;
      setSubscriptionItems((prevState) => [
        ...prevState,
        updateForSubscription,
      ]);
      if (!isExpanded) {
        showNotification(updateForSubscription);
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  const [subscriptionItems, setSubscriptionItems] = useState<Item[]>([]);

  const [successfulSends, setSuccessfulSends] = useState<PendingItem[]>([]);

  const initialItemsQuery = useQuery(gqlGetInitialItems(pinboardId));

  const initialLastItemSeenByUsers = useQuery(
    gqlGetLastItemSeenByUsers(pinboardId)
  );

  const [
    lastItemSeenByUserLookup,
    setLastItemSeenByUserLookup,
  ] = useState<LastItemSeenByUserLookup>({});

  useSubscription(gqlOnSeenItem(pinboardId), {
    onSubscriptionData: ({ subscriptionData }) => {
      const newLastItemSeenByUser: LastItemSeenByUser =
        subscriptionData.data.onSeenItem;
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

  useEffect(() => {
    if (initialLastItemSeenByUsers.data) {
      const newLastItemSeenByUserLookup = initialLastItemSeenByUsers.data.listLastItemSeenByUsers.reduce(
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
        lastItemSeenByUserLookup
      );
      setLastItemSeenByUserLookup(newLastItemSeenByUserLookup);

      const lastItemSeenByUser = newLastItemSeenByUserLookup[userEmail];
      if (initialItemsQuery.data) {
        const lastInitialItem = [
          ...initialItemsQuery.data.listItems,
        ].sort((a: Item, b: Item) =>
          b.timestamp.localeCompare(a.timestamp)
        )?.[0];
        if (
          lastInitialItem &&
          lastInitialItem.id !== lastItemSeenByUser?.itemID
        ) {
          setUnreadFlag(pinboardId)(true);
        }
      }
    }
  }, [initialItemsQuery.data, initialLastItemSeenByUsers.data]);

  useEffect(
    () =>
      setError(pinboardId, initialItemsQuery.error || itemSubscription.error),
    [initialItemsQuery.error, itemSubscription.error]
  );
  const hasError = !!errors[pinboardId];

  const onSuccessfulSend = (pendingItem: PendingItem) => {
    setSuccessfulSends((previousSends) => [...previousSends, pendingItem]);

    // ensure any pinboard you contribute to ends up on your list of manually opened pinboards
    addManuallyOpenedPinboardId(pendingItem.pinboardId);

    // ensure any pinboard you're mentioned on ends up on your list of manually opened pinboards
    pendingItem.mentions?.map((mentionEmail) =>
      addManuallyOpenedPinboardId(pendingItem.pinboardId, mentionEmail)
    );
  };

  return !isSelected ? null : (
    <React.Fragment>
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
          initialItems={initialItemsQuery.data.listItems}
          successfulSends={successfulSends}
          subscriptionItems={subscriptionItems}
          setUnreadFlag={setUnreadFlag(pinboardId)}
          isExpanded={isExpanded}
          userLookup={userLookup}
          userEmail={userEmail}
          pinboardId={pinboardId}
          lastItemSeenByUserLookup={lastItemSeenByUserLookup}
        />
      )}
      {activeTab === "asset" && initialItemsQuery.data && (
        <AssetView
          initialItems={initialItemsQuery.data.listItems}
          successfulSends={successfulSends}
          subscriptionItems={subscriptionItems}
        />
      )}
      {activeTab === "chat" && (
        <SendMessageArea
          onSuccessfulSend={onSuccessfulSend}
          payloadToBeSent={payloadToBeSent}
          clearPayloadToBeSent={clearPayloadToBeSent}
          allUsers={userLookup && Object.values(userLookup)}
          onError={(error) => setError(pinboardId, error)}
          userEmail={userEmail}
          pinboardId={pinboardId}
          panelElement={panelElement}
        />
      )}
    </React.Fragment>
  );
};
