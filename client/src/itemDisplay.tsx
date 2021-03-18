/** @jsx jsx */
import { Item } from "../../shared/graphql/graphql";
import React from "react";
import { User } from "../../shared/User";
import { css, jsx } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { space } from "@guardian/src-foundations";

interface ItemDisplayProps {
  item: Item | PendingItem;
  refForLastItem: React.RefObject<HTMLDivElement> | undefined;
}

export const ItemDisplay = ({ item, refForLastItem }: ItemDisplayProps) => {
  const user = JSON.parse(item.user) as User;
  const payload = item.payload && JSON.parse(item.payload);
  const isPendingSend = "pending" in item && item.pending;

  return (
    <div
      ref={refForLastItem}
      css={css`
        border-bottom: 1px solid gray;
        padding-bottom: ${space[1]}px;
        margin-bottom: ${space[1]}px;
        font-style: ${isPendingSend ? "italic" : "normal"};
      `}
    >
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          color: lightgray;
        `}
      >
        <span>{user.firstName}</span>
        <span>
          {new Date(item.timestamp * 1000).toTimeString().substr(0, 8)}
        </span>
      </div>
      <div>{item.message}</div>
      {payload && <PayloadDisplay type={item.type} payload={payload} />}
    </div>
  );
};
