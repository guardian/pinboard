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
        width: ${100 / scale}%;
        position: relative;
        user-select: none;
      `}
    >
      <div
        css={css`
          padding: ${space[1]}px;
          border: solid ${palette.neutral["86"]};
          border-width: 5px 1px 0 1px;
          opacity: 0.8;
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
          bottom: -1px;
          position: absolute;
          background: linear-gradient(
            transparent,
            ${palette.neutral["93"]},
            ${palette.neutral["93"]}
          );
        `}
      />
    </div>
  );
};
