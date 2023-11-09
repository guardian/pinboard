import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React from "react";
import { Item, User } from "shared/graphql/graphql";
import { AvatarRoundel } from "./avatarRoundel";
import { formatMentionHandlesInText } from "./mentionsUtil";
import { FormattedDateTime } from "./formattedDateTime";
import { agateSans } from "../fontNormaliser";
import { maybeConstructPayloadAndType } from "./types/PayloadAndType";
import { PayloadDisplay } from "./payloadDisplay";

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

  const payloadAndType = maybeConstructPayloadAndType(item.type, item.payload);

  return (
    <div
      css={css`
        display: flex;
        gap: ${space[1]}px;
        user-select: none;
        color: ${palette.neutral[46]};
        mix-blend-mode: multiply;
        ${agateSans.xxsmall()}
        background-color: ${palette.neutral["97"]};
        padding: ${space[1]}px;
        border-radius: ${space[1]}px;
        max-height: 75px;
        overflow: hidden;
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
      {payloadAndType && (
        <div
          css={css`
            width: 50px;
          `}
        >
          <div
            css={css`
              transform-origin: top left;
              transform: scale(25%);
              width: 200px;
            `}
          >
            <PayloadDisplay
              payloadAndType={payloadAndType}
              tab="chat"
              shouldNotBeClickable
            />
          </div>
        </div>
      )}
      <div
        css={css`
          flex-grow: 1;
        `}
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
            maybeUserOrGroupOrChatBot={maybeUser}
            size={18}
            fallback={item.userEmail}
          />
          {maybeUser
            ? `${maybeUser.firstName} ${maybeUser.lastName}`
            : item.userEmail}
        </div>
        <div
          css={css`
            margin-left: ${payloadAndType ? 0 : 10}px;
          `}
        >
          <FormattedDateTime timestamp={new Date(item.timestamp).valueOf()} />
          {item.editHistory && item.editHistory.length > 0 && (
            <span> - Edited</span>
          )}
          {item.relatedItemId && item.type !== "claim" && <span> - Reply</span>}
          <div
            css={css`
              max-height: 35px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            <span
              css={css`
                font-style: italic;
                color: ${palette.neutral["46"]};
                font-size: 12px;
              `}
            >
              {item.deletedAt && "ITEM DELETED"}
              {item.type === "claim" && "...claimed a request"}
            </span>
            {formattedMessage}
          </div>
        </div>
      </div>
    </div>
  );
};
