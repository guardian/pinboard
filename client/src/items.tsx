import {Item} from "../../shared/graphql/graphql";
import React from "react";
import {User} from "../../shared/User";

const ItemDisplay = (item: Item) => {

  const user = JSON.parse(item.user) as User;

  return (
    <div key={item.id} style={{
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
        <span>{new Date(item.timestamp).toTimeString().substr(0, 8)}</span>
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
export const Items = ({items}: ItemsProps) => (
  <div>
    {items.map(ItemDisplay)}
  </div>
);