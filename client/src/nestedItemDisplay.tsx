import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React from "react";
import { Item, User } from "shared/graphql/graphql";
import { AvatarRoundel } from "./avatarRoundel";
import { formatMentionHandlesInText } from "./mentionsUtil";
import { FormattedDateTime } from "./formattedDateTime";
import { agateSans } from "../fontNormaliser";

interface NestedItemDisplayProps {
  item: Item;
  maybeUser: User | undefined;
  maybeScrollToItem?: (itemID: string) => void;
}

export const NestedItemDisplay = ({
  item,
  maybeUser,
  maybeScrollToItem,
}: NestedItemDisplayProps) => {
  const formattedMessage =
    item.message &&
    formatMentionHandlesInText(
      [...(item.mentions || []), ...(item.groupMentions || [])],
      item.message
    );
  return (
    <div
      css={css`
        user-select: none;
        color: ${palette.neutral[46]};
        mix-blend-mode: multiply;
        ${agateSans.xxsmall()}
        background-color: ${palette.neutral["97"]};
        padding: ${space[1]}px;
        border-radius: ${space[1]}px;
        max-height: 75px;
        overflow: hidden;
        text-overflow: ellipsis;
        ${maybeScrollToItem
          ? css`
              cursor: pointer;
              &:hover {
                background-color: ${palette.neutral["93"]};
              }
            `
          : ""}
      `}
      onClick={maybeScrollToItem && (() => maybeScrollToItem(item.id))}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
          font-weight: bold;
          gap: ${space[1]}px;
          margin-bottom: ${space[1]}px;
        `}
      >
        <AvatarRoundel
          maybeUserOrGroup={maybeUser}
          size={18}
          fallback={item.userEmail}
        />
        {maybeUser
          ? `${maybeUser.firstName} ${maybeUser.lastName}`
          : item.userEmail}
      </div>
      <div
        css={css`
          margin-left: ${10}px;
        `}
      >
        <FormattedDateTime timestamp={new Date(item.timestamp).valueOf()} />
        <div>{formattedMessage}</div>
        {/* TODO add support for payloads*/}
      </div>
    </div>
  );
};
