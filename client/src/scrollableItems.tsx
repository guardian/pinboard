import { Item, LastItemSeenByUser, User } from "../../shared/graphql/graphql";
import React, {
  ReactElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { ItemDisplay } from "./itemDisplay";
import { PendingItem } from "./types/PendingItem";
import { useMutation } from "@apollo/client";
import { gqlSeenItem } from "../gql";
import { LastItemSeenByUserLookup } from "./pinboard";
import { scrollbarsCss } from "./styling";
import { SvgArrowDownStraight } from "@guardian/source-react-components";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";

interface ScrollableItemsProps {
  initialItems: Item[];
  successfulSends: PendingItem[];
  subscriptionItems: Item[];
  setUnreadFlag: (hasUnread: boolean) => void;
  isExpanded: boolean;
  userLookup: { [email: string]: User } | undefined;
  userEmail: string;
  pinboardId: string;
  lastItemSeenByUserLookup: LastItemSeenByUserLookup;
  showNotification: (item: Item) => void;
}

const isScrollbarVisible = (scrollableArea: HTMLDivElement) =>
  scrollableArea.scrollHeight > scrollableArea.clientHeight;

const elementIsVisible = (
  scrollableArea: HTMLDivElement,
  element: HTMLElement
) => {
  const elementTopRelativeToScrollableArea =
    element.offsetTop - scrollableArea.offsetTop;
  const scrollTop = scrollableArea.scrollTop;
  const scrollableAreaHeight = scrollableArea.clientHeight;
  const scrollTopThreshold =
    elementTopRelativeToScrollableArea - scrollableAreaHeight - 10;
  return scrollTop > scrollTopThreshold;
};

interface ItemsMap {
  [id: string]: Item | PendingItem;
}

export const ScrollableItems = ({
  initialItems,
  successfulSends,
  subscriptionItems,
  setUnreadFlag,
  isExpanded,
  userLookup,
  userEmail,
  pinboardId,
  lastItemSeenByUserLookup,
  showNotification,
}: ScrollableItemsProps): ReactElement => {
  const itemsMap = [
    ...initialItems,
    ...successfulSends,
    ...subscriptionItems, // any subscription items with same ids as 'successfulSends' will override (and therefore pending:true will be gone)
  ].reduce(
    (accumulator, item) => ({
      ...accumulator,
      [item.id]: item,
    }),
    {} as ItemsMap
  );

  const items = Object.values(itemsMap).sort(
    (a, b) => a.timestamp - b.timestamp
  );

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

  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const scrollableArea = scrollableAreaRef.current;

  const lastItemRef = useRef<HTMLDivElement>(null);
  const lastItemIndex = items.length - 1;

  const scrollToLastItem = () => {
    lastItemRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const [
    hasThisPinboardEverBeenExpanded,
    setHasThisPinboardEverBeenExpanded,
  ] = useState(false);

  useEffect(() => {
    scrollableArea &&
      scrollableArea.scrollHeight > 0 &&
      !hasThisPinboardEverBeenExpanded &&
      setHasThisPinboardEverBeenExpanded(true);
  });

  useLayoutEffect(scrollToLastItem, [hasThisPinboardEverBeenExpanded]);

  const shouldBeScrolledToLastItem = () =>
    document.hasFocus() &&
    (!scrollableArea ||
      !lastItemRef.current ||
      !isScrollbarVisible(scrollableArea) ||
      elementIsVisible(scrollableArea, lastItemRef.current));

  const lastItemID = items[lastItemIndex]?.id;

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
    if (lastItemID !== lastItemSeenByUserLookup[userEmail]?.itemID) {
      seenItem({
        variables: {
          input: {
            pinboardId,
            itemID: lastItemID,
          },
        },
      });
      sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.MESSAGE_SEEN, {
        pinboardId,
      });
    }
  };

  const hasUnread =
    lastItemSeenByUserLookup &&
    lastItemSeenByUserLookup[userEmail]?.itemID !== lastItemID;

  useEffect(() => {
    setUnreadFlag(hasUnread);
  }, [hasUnread]);

  useEffect(() => {
    if (shouldBeScrolledToLastItem()) {
      scrollToLastItem();
      isExpanded && seenLastItem();
    }
    if (successfulSends?.length > 0 && subscriptionItems?.length > 0) {
      // guard against first mount where these arrays are empty
      showNotification(items[lastItemIndex]);
    }
  }, [successfulSends, subscriptionItems]); // runs after render when the list of sends or subscription items has changed (i.e. new message sent or received)

  useEffect(() => {
    if (isExpanded && shouldBeScrolledToLastItem() && lastItemID) {
      seenLastItem();
    }
  }, [isExpanded]); // runs when expanded/closed

  return (
    <div
      ref={scrollableAreaRef}
      css={css`
        overflow-y: auto;
        ${scrollbarsCss(palette.neutral[60])}
        padding: ${space[2]}px;
        position: relative;
      `}
      onScroll={() =>
        shouldBeScrolledToLastItem() && lastItemID && seenLastItem()
      }
    >
      {items.map((item, index) => (
        <ItemDisplay
          key={item.id}
          item={item}
          refForLastItem={index === lastItemIndex ? lastItemRef : undefined}
          userLookup={userLookup}
          userEmail={userEmail}
          seenBy={lastItemSeenByUsersForItemIDLookup[item.id]}
          maybePreviousItem={items[index - 1]}
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
            onClick={() =>
              scrollableArea && isScrollbarVisible(scrollableArea)
                ? scrollToLastItem()
                : seenLastItem()
            }
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
