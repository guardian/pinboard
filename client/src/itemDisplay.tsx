/** @jsx jsx */
import { Item, User } from "../../shared/graphql/graphql";
import React from "react";
import { css, jsx } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { space } from "@guardian/src-foundations";

interface ItemDisplayProps {
  item: Item | PendingItem;
  refForLastItem: React.RefObject<HTMLDivElement> | undefined;
  userLookup: { [email: string]: User } | undefined;
}

export const ItemDisplay = ({
  item,
  refForLastItem,
  userLookup,
}: ItemDisplayProps) => {
  const user = userLookup?.[item.userEmail];
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
        {/* TODO: add avatar as well */}
        <span>
          {user ? `${user.firstName} ${user.lastName}` : item.userEmail}
        </span>
        <span>
          {new Date(item.timestamp * 1000).toTimeString().substr(0, 8)}
        </span>
      </div>
      <div>{item.message}</div>
      {payload && <PayloadDisplay type={item.type} payload={payload} />}
    </div>
  );
};
