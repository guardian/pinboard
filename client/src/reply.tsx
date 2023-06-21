import { Item, User } from "shared/graphql/graphql";
import { css } from "@emotion/react";
import { space } from "@guardian/source-foundations";
import React from "react";
import { NestedItemDisplay } from "./nestedItemDisplay";
import { FloatingClearButton } from "./floatingClearButton";

interface ReplyProps {
  item: Item;
  maybeUser: User | undefined;
  maybeScrollToItem?: (itemID: string) => void;
  clearMaybeReplyingToItemId?: () => void;
}

export const Reply = ({ clearMaybeReplyingToItemId, ...props }: ReplyProps) => (
  <div
    css={
      props.maybeScrollToItem
        ? css`
            margin-bottom: ${space[1]}px;
          `
        : css`
            margin: ${space[1]}px;
          `
    }
  >
    <div
      css={css`
        position: relative;
      `}
    >
      <NestedItemDisplay {...props} />
      {clearMaybeReplyingToItemId && (
        <FloatingClearButton clear={clearMaybeReplyingToItemId} />
      )}{" "}
    </div>
  </div>
);
