import {
  Claimed,
  Item,
  LastItemSeenByUser,
  MutationClaimItemArgs,
} from "../../shared/graphql/graphql";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { ItemDisplay } from "./itemDisplay";
import { FetchResult, useMutation } from "@apollo/client";
import { gqlSeenItem } from "../gql";
import { ItemsMap, LastItemSeenByUserLookup } from "./pinboard";
import { scrollbarsCss } from "./styling";
import { SvgArrowDownStraight } from "@guardian/source-react-components";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";
import { useGlobalStateContext } from "./globalState";
import { useThrottle } from "./util";
import { PendingItem } from "./types/PendingItem";
import { UserLookup } from "./types/UserLookup";

interface ScrollableItemsProps {
  items: Item[];
  itemsMap: ItemsMap;
  successfulSends: PendingItem[];
  subscriptionItems: Item[];
  maybeLastItem: Item | undefined;
  hasUnread: boolean | undefined;
  isExpanded: boolean;
  userLookup: UserLookup;
  userEmail: string;
  pinboardId: string;
  lastItemSeenByUserLookup: LastItemSeenByUserLookup;
  showNotification: (item: Item) => void;
  claimItem: (options: {
    variables: MutationClaimItemArgs;
  }) => Promise<FetchResult<{ claimItem: Claimed }>>;
}

export const ScrollableItems = ({
  items,
  itemsMap,
  successfulSends,
  subscriptionItems,
  maybeLastItem,
  hasUnread,
  isExpanded,
  userLookup,
  userEmail,
  pinboardId,
  lastItemSeenByUserLookup,
  showNotification,
  claimItem,
}: ScrollableItemsProps) => {
  const { isRepositioning } = useGlobalStateContext();

  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const lastItemSeenByUsersForItemIDLookup = Object.values(
    lastItemSeenByUserLookup
  )
    .filter((lastItemSeenByUser) => lastItemSeenByUser.userEmail !== userEmail)
    .reduce((accumulator, lastItemSeenByUser) => {
      const existingSeenBysForItemID =
        accumulator[lastItemSeenByUser.itemID] || [];
      return {
        ...accumulator,
        [lastItemSeenByUser.itemID]: [
          ...existingSeenBysForItemID,
          lastItemSeenByUser,
        ],
      };
    }, {} as { [itemID: string]: LastItemSeenByUser[] });

  const [
    hasPinboardNeverBeenExpanded,
    setHasPinboardNeverBeenExpanded,
  ] = useState(true);

  const [scrollableArea, setScrollableArea] = useState<HTMLDivElement | null>(
    null
  );
  const setScrollableAreaRef = useCallback(
    (node) => node && setScrollableArea(node),
    []
  );
  useLayoutEffect(() => {
    if (hasPinboardNeverBeenExpanded && scrollableArea && isExpanded) {
      scrollableArea.scrollTop = Number.MAX_SAFE_INTEGER;
      setTimeout(() => {
        scrollableArea.scrollTop = Number.MAX_SAFE_INTEGER;
      }, 100);
      setHasPinboardNeverBeenExpanded(false);
    }
  }, [scrollableArea, isExpanded]);

  const [
    scrollTopBeforeReposition,
    setScrollTopBeforeReposition,
  ] = useState<number>(50);
  useMemo(() => {
    if (isRepositioning && scrollableArea) {
      console.log("reposition started, capturing scrollTop");
      setScrollTopBeforeReposition(scrollableArea.scrollTop);
    }
  }, [isRepositioning]);

  useLayoutEffect(() => {
    if (!isRepositioning && scrollableArea) {
      console.log("reposition finished, restoring scrollTop");
      scrollableArea.scrollTop = scrollTopBeforeReposition;
    }
  }, [isRepositioning]);

  const scrollToLastItem = () => {
    scrollableArea?.scroll({
      top: Number.MAX_SAFE_INTEGER,
      behavior: "smooth",
    });
    onScroll();
  };

  const [seenItem] = useMutation<{ seenItem: LastItemSeenByUser }>(
    gqlSeenItem,
    {
      onError(error) {
        console.error("Failed to mark item as seen", error);
      }, // TODO bubble up as proper error
    }
  );

  const sendTelemetryEvent = useContext(TelemetryContext);

  const seenLastItem = () => {
    // don't keep sending mutations if everyone already knows we've seen it
    if (
      maybeLastItem &&
      maybeLastItem.id !== lastItemSeenByUserLookup[userEmail]?.itemID
    ) {
      seenItem({
        variables: {
          input: {
            pinboardId,
            itemID: maybeLastItem.id,
          },
        },
      });
      sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.MESSAGE_SEEN, {
        pinboardId,
      });
    }
  };

  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToLastItem();
      isExpanded && seenLastItem();
    }
    if (
      maybeLastItem &&
      successfulSends?.length > 0 &&
      subscriptionItems?.length > 0
    ) {
      // guard against first mount where these arrays are empty
      showNotification(maybeLastItem);
    }
  }, [successfulSends, subscriptionItems]); // runs after render when the list of sends or subscription items has changed (i.e. new message sent or received)

  useEffect(() => {
    if (isExpanded && isScrolledToBottom && maybeLastItem) {
      seenLastItem();
    }
  }, [isExpanded]); // runs when expanded/closed

  const onScroll = () => {
    if (!scrollableArea) {
      return;
    }
    const { scrollHeight, offsetHeight, scrollTop } = scrollableArea;
    const maxScrollTop = scrollHeight - offsetHeight - 10; // 10 is for padding
    const scrollTopThreshold = maxScrollTop - 10; // in case not exactly scrolled to bottom
    const newIsScrolledToBottom = scrollTop > scrollTopThreshold;
    setIsScrolledToBottom(newIsScrolledToBottom);
    if (newIsScrolledToBottom && maybeLastItem && isExpanded) {
      seenLastItem();
    }
  };

  const onScrollThrottled = useThrottle(onScroll, 250);

  const scrollToBottomIfApplicable = () =>
    isScrolledToBottom && scrollToLastItem();

  return (
    <div
      ref={setScrollableAreaRef}
      css={css`
        overflow-y: auto;
        ${scrollbarsCss(palette.neutral[60])}
        padding: ${space[2]}px;
        position: relative;
      `}
      onScroll={onScrollThrottled}
    >
      {!isRepositioning &&
        items.map((item, index) => (
          <ItemDisplay
            key={item.id}
            item={item}
            userLookup={userLookup}
            seenBy={lastItemSeenByUsersForItemIDLookup[item.id]}
            maybePreviousItem={items[index - 1]}
            scrollToBottomIfApplicable={scrollToBottomIfApplicable}
            claimItem={() => claimItem({ variables: { itemId: item.id } })}
            maybeClaimedItem={
              item.type === "claim" &&
              !!item.payload &&
              itemsMap[JSON.parse(item.payload).itemId]
            }
          />
        ))}
      {hasUnread && (
        <div
          css={css`
            position: sticky;
            bottom: ${space[5]}px;
            display: flex;
            justify-content: center;
          `}
        >
          <button
            onClick={scrollToLastItem}
            css={css`
              fill: white;
              background-color: ${palette.neutral[20]};
              font-weight: bold;
              height: 32px;
              width: 32px;
              border-radius: 999px;
              display: flex;
              justify-content: center;
              align-items: center;
              border: none;
              cursor: pointer;
            `}
          >
            <SvgArrowDownStraight size="xsmall" />
          </button>
        </div>
      )}
    </div>
  );
};
