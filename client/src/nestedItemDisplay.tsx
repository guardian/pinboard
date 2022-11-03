import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React from "react";
import { ItemDisplay } from "./itemDisplay";
import { Claimed, Item } from "../../shared/graphql/graphql";
import { UserLookup } from "./types/UserLookup";
import { FetchResult } from "@apollo/client";

interface NestedItemDisplayProps {
  item: Item;
  userLookup: UserLookup;
  scrollToBottomIfApplicable: () => void;
  claimItem: () => Promise<FetchResult<{ claimItem: Claimed }>>;
  userEmail: string;
  scrollToItem: (itemID: string) => void;
}

export const NestedItemDisplay = (props: NestedItemDisplayProps) => {
  const scale = 0.8;
  return (
    <div
      css={css`
        transform-origin: top left;
        scale: ${scale};
        width: ${100 / scale - 10}%;
        position: relative;
        user-select: none;
        margin-top: ${space[2]}px;
        margin-left: ${space[3]}px;
      `}
    >
      <div
        css={css`
          padding: ${space[1]}px;
          background-color: #f6f6f6;
          border-radius: ${space[1]}px;
          max-height: 75px;
          overflow: hidden;
          cursor: pointer;
          &:hover {
            opacity: 1;
          }
        `}
        onClick={() => props.scrollToItem(props.item.id)}
      >
        <ItemDisplay
          {...props}
          seenBy={undefined}
          maybePreviousItem={undefined}
          maybeRelatedItem={undefined}
        />
      </div>
      <div
        css={css`
          height: 15px;
          width: 100%;
          position: absolute;
        `}
      />
    </div>
  );
};
