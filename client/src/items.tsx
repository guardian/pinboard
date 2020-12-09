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
  initialItems: Item[],
  subscriptionItems: Item[],
  setHasUnread: (hasUnread: boolean) => void,
  isExpanded: boolean
}
export const Items = ({initialItems, subscriptionItems, setHasUnread, isExpanded}: ItemsProps) => {

  const items = [...initialItems, ...subscriptionItems].sort((a, b) => a.timestamp - b.timestamp);

  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const scrollableArea = scrollableAreaRef.current;

  const lastItemRef = useRef<HTMLDivElement>(null);
  const lastItemIndex = items.length-1;

  const scrollToLastItem = () => { setTimeout(
    () =>  lastItemRef.current?.scrollIntoView({behavior: "smooth", block: "end"}), 
    1
  )};
  

  useEffect(scrollToLastItem, []); // runs once at the beginning

  const isLastItemVisible = () => scrollableArea && lastItemRef.current && scrollableArea.scrollTop > (lastItemRef.current.offsetTop - scrollableArea.offsetHeight - 10)

  useEffect(() => {
    if (isLastItemVisible()){
      scrollToLastItem();
    } else if(isExpanded) {
      setHasUnread(true);
    } 
  }, [subscriptionItems]); // runs after render when the list of subscription items has changed (e.g. new message received)

  useEffect(() => {
    if (isExpanded && isLastItemVisible()){
      setHasUnread(false);
    }
  }, [isExpanded]); // runs when the widget is expanded/closed

  return (
    <div ref={scrollableAreaRef} style={{
      overflowY: "auto",
      margin: '5px',
    }}
    onScroll={() => isLastItemVisible() && setHasUnread(false)}>
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