/** @jsx jsx */
import { Item } from "../../shared/graphql/graphql";
import React, { ReactElement, useEffect, useRef } from "react";
import { User } from "../../shared/User";
import { css, jsx } from "@emotion/react";
import { pinboardPrimary } from "../colours";

interface ItemDisplayProps {
  item: Item | PendingItem;
  refForLastItem: React.RefObject<HTMLDivElement> | undefined;
}

const ItemDisplay = ({ item, refForLastItem }: ItemDisplayProps) => {
  const user = JSON.parse(item.user) as User;
  const isPendingSend = "pending" in item && item.pending;

  return (
    <div
      ref={refForLastItem}
      css={css`
        border-bottom: 1px solid gray;
        padding-bottom: 3px;
        margin-bottom: 3px;
        font-style: ${isPendingSend ? "italic" : "normal"};
      `}
    >
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          font-size: 80%;
          color: lightgray;
        `}
      >
        <span>{user.firstName}</span>
        <span>
          {new Date(item.timestamp * 1000).toTimeString().substr(0, 8)}
        </span>
      </div>
      <div>{item.message}</div>
    </div>
  );
};

interface ScrollableItemsProps {
  initialItems: Item[];
  successfulSends: PendingItem[];
  subscriptionItems: Item[];
  setHasUnread: (hasUnread: boolean) => void;
  isExpanded: boolean;
  hasUnread: boolean | undefined;
}

const isScrollbarVisible = (scrollableArea: HTMLDivElement) =>
  scrollableArea.scrollHeight >= scrollableArea.clientHeight;

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

export interface PendingItem extends Item {
  pending: true;
}

interface ItemsMap {
  [id: string]: Item | PendingItem;
}

export const ScrollableItems = ({
  initialItems,
  successfulSends,
  subscriptionItems,
  setHasUnread,
  isExpanded,
  hasUnread,
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

  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const scrollableArea = scrollableAreaRef.current;

  const lastItemRef = useRef<HTMLDivElement>(null);
  const lastItemIndex = items.length - 1;

  const scrollToLastItem = () => {
    setTimeout(
      // TODO: could we use request animation frame?
      () =>
        lastItemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        }),
      1
    );
  };

  useEffect(scrollToLastItem, []); // runs once at the beginning

  const isLastItemVisible = () =>
    !scrollableArea ||
    !lastItemRef.current ||
    !isScrollbarVisible(scrollableArea) ||
    elementIsVisible(scrollableArea, lastItemRef.current);

  useEffect(() => {
    if (isLastItemVisible()) {
      scrollToLastItem();
    } else if (isExpanded) {
      setHasUnread(true);
    }
  }, [successfulSends, subscriptionItems]); // runs after render when the list of sends or subscription items has changed (i.e. new message sent or received)

  useEffect(() => {
    if (isExpanded && isLastItemVisible()) {
      setHasUnread(false);
    }
  }, [isExpanded]); // runs when the widget is expanded/closed

  return (
    <div
      ref={scrollableAreaRef}
      css={css`
        overflow-y: auto;
        margin: 5px;
        color: black;
        position: relative;
      `}
      onScroll={() => isLastItemVisible() && setHasUnread(false)}
    >
      {items.map((item, index) => (
        <ItemDisplay
          key={item.id}
          item={item}
          refForLastItem={index === lastItemIndex ? lastItemRef : undefined}
        />
      ))}
      {hasUnread && (
        <div
          css={css`
            position: sticky;
            bottom: 20px;
            text-align: center;
          `}
        >
          <button
            onClick={scrollToLastItem}
            css={css`
              color: white;
              background-color: red;
              padding: 3px 8px 4px;
              font-weight: bold;
              height: 24px;
              border-radius: 12px;
              font-size: 14px;
              border: none;
              box-shadow: 0 0 6px 3px ${pinboardPrimary};
            `}
          >
            ↓ Unread ↓
          </button>
        </div>
      )}
    </div>
  );
};
