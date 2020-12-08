import {Item} from "../../shared/graphql/graphql";
import React, {useEffect, useRef} from "react";
import {User} from "../../shared/User";

interface ItemDisplayProps {
  item: Item;
  refForLastItem:  React.RefObject<HTMLDivElement> | undefined
}

const ItemDisplay = ({item, refForLastItem}: ItemDisplayProps) => {

  const user = JSON.parse(item.user) as User;

  return (
    <div ref={refForLastItem} style={{
      borderBottom: "1px solid gray",
      paddingBottom: "3px",
      marginBottom: "3px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "80%",
        color: "lightgray"
      }}>
        <span>{user.firstName}</span>
        <span>{new Date(item.timestamp * 1000).toTimeString().substr(0, 8)}</span>
      </div>
      <div>
        {item.message}
      </div>
    </div>
  )
}

interface ItemsProps {
  items: Item[]
}
export const Items = ({items}: ItemsProps) => {

  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const scrollableArea = scrollableAreaRef.current;

  const lastItemRef = useRef<HTMLDivElement>(null);
  const lastItemIndex = items.length-1;

  const scrollToLastItem = () =>
    lastItemRef.current?.scrollIntoView({behavior: "smooth", block: "end"});

  useEffect(scrollToLastItem, []); // runs once at the beginning TODO ensure this doesn't happen when expanded subsequent times

  // calculate this before the render
  const isScrolledToBottom = scrollableArea &&
    scrollableArea.scrollTop >= (scrollableArea.scrollHeight - scrollableArea.offsetHeight - 20); // 20 pixels tolerance

  useEffect(() => {
    if (isScrolledToBottom){
      scrollToLastItem();
    }
  }, [items]); // runs after render when the list of items has changed (e.g. new message received)

  return (
    <div ref={scrollableAreaRef} style={{
      overflowY: "auto",
      margin: '5px',
    }}>
      {items.map((item, index) => (
        <ItemDisplay
          key={item.id}
          item={item}
          refForLastItem={index === lastItemIndex ? lastItemRef : undefined}
        />
      ))}
    </div>
  );
}