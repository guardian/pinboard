import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React from "react";
import { Item, User } from "../../shared/graphql/graphql";
import { AvatarRoundel } from "./avatarRoundel";
import { formatMentionHandlesInText } from "./mentionsUtil";
import { FormattedDateTime } from "./formattedDateTime";
import { agateSans } from "../fontNormaliser";

interface NestedItemDisplayProps {
  item: Item;
  maybeUser: User | undefined;
  scrollToItem: (itemID: string) => void;
}

export const NestedItemDisplay = ({
  item,
  maybeUser,
  scrollToItem,
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
        margin-top: ${space[2]}px;
        margin-left: ${space[3]}px;
        color: ${palette.neutral[46]};
        mix-blend-mode: multiply;
        ${agateSans.xxsmall()}
        background-color: ${palette.neutral["97"]};
        padding: ${space[1]}px;
        border-radius: ${space[1]}px;
        max-height: 75px;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        &:hover {
          background-color: ${palette.neutral["93"]};
        }
      `}
      onClick={() => scrollToItem(item.id)}
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
      </div>
    </div>
  );
};
