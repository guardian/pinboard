import {
  Claimed,
  Item,
  LastItemSeenByUser,
} from "../../shared/graphql/graphql";
import React, { useMemo } from "react";
import { css } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { palette, space } from "@guardian/source-foundations";
import { SeenBy } from "./seenBy";
import { AvatarRoundel } from "./avatarRoundel";
import { agateSans } from "../fontNormaliser";
import { maybeConstructPayloadAndType } from "./types/PayloadAndType";
import { FormattedDateTime } from "./formattedDateTime";
import { UserLookup } from "./types/UserLookup";
import { FetchResult } from "@apollo/client";
import { ClaimableItem } from "./claimableItem";
import { NestedItemDisplay } from "./nestedItemDisplay";
import { formatMentionHandlesInText } from "./mentionsUtil";
import Tick from "../icons/tick.svg";
import { composer } from "../colours";
import Pencil from "../icons/pencil.svg";
import { ITEM_HOVER_MENU_CLASS_NAME, ItemHoverMenu } from "./itemHoverMenu";
import { EditItem } from "./editItem";
import { Reply } from "./reply";

interface ItemDisplayProps {
  item: Item | PendingItem;
  userLookup: UserLookup;
  seenBy: LastItemSeenByUser[] | undefined;
  maybePreviousItem: Item | PendingItem | undefined;
  claimItem: () => Promise<FetchResult<{ claimItem: Claimed }>>;
  maybeRelatedItem: Item | false | undefined;
  userEmail: string;
  setRef?: (node: HTMLDivElement) => void;
  scrollToItem: (itemID: string) => void;
  setMaybeDeleteItemModalElement: (element: JSX.Element | null) => void;
  maybeEditingItemId: string | null;
  setMaybeEditingItemId: (itemId: string | null) => void;
  setMaybeReplyingToItemId: (itemId: string | null) => void;
}

export const ItemDisplay = ({
  item,
  userLookup,
  seenBy,
  maybePreviousItem,
  claimItem,
  maybeRelatedItem,
  userEmail,
  setRef,
  scrollToItem,
  setMaybeDeleteItemModalElement,
  maybeEditingItemId,
  setMaybeEditingItemId,
  setMaybeReplyingToItemId,
}: ItemDisplayProps) => {
  const user = userLookup?.[item.userEmail];
  const userDisplayName = user
    ? `${user.firstName} ${user.lastName}`
    : item.userEmail;
  const payloadAndType = maybeConstructPayloadAndType(item.type, item.payload);
  const isPendingSend = "pending" in item && item.pending;

  const mentionHandles = [
    ...(item.mentions || []),
    ...(item.groupMentions || []),
  ];

  const formattedMessage = useMemo(
    () =>
      item.message && formatMentionHandlesInText(mentionHandles, item.message),
    [item.id, item.message]
  );

  const dateInMillisecs = new Date(item.timestamp).valueOf();

  const isDifferentUserFromPreviousItem =
    maybePreviousItem?.userEmail !== item.userEmail;

  const maybeClaimedBy = useMemo(
    () => item.claimedByEmail && userLookup[item.claimedByEmail],
    [item.claimedByEmail, userLookup]
  );

  const isImmediatelyFollowingRelatedItem =
    maybeRelatedItem && maybePreviousItem?.id === maybeRelatedItem.id;

  const isDeleted = item.deletedAt;
  const isEdited = item.editHistory && item.editHistory.length > 0;

  const isMutable =
    !isDeleted &&
    !maybeEditingItemId &&
    item.userEmail === userEmail &&
    item.type !== "claim" &&
    !item.claimedByEmail;

  return (
    <div
      ref={setRef}
      css={css`
        padding-bottom: ${space[1]}px;
        margin-bottom: ${space[1]}px;
        font-style: ${isPendingSend ? "italic" : "normal"};
        ${agateSans.small({ lineHeight: "tight" })};
        color: ${palette.neutral[7]};
        overflow-wrap: anywhere;
        &:hover {
          .${ITEM_HOVER_MENU_CLASS_NAME} {
            display: flex;
          }
        }
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        {isDifferentUserFromPreviousItem && (
          <React.Fragment>
            <AvatarRoundel
              maybeUserOrGroup={user}
              size={28}
              fallback={item.userEmail}
            />
            <span
              css={css`
                flex-grow: 1;
                margin-left: ${space[1]}px;
                ${agateSans.small({ fontWeight: "bold", lineHeight: "tight" })};
                color: ${palette.neutral[20]};
              `}
            >
              {userDisplayName}
            </span>
          </React.Fragment>
        )}
      </div>
      <div
        css={css`
          margin-left: ${space[9] - 4}px;
        `}
      >
        <div
          css={css`
            position: relative;
            color: ${palette.neutral["20"]};
            ${agateSans.xxsmall({ lineHeight: "tight" })};
            margin-bottom: 2px;
          `}
        >
          <FormattedDateTime timestamp={dateInMillisecs} />
          {isEdited && <span>&nbsp;-&nbsp;Edited</span>}
          {maybeRelatedItem && item.type !== "claim" && (
            <span>&nbsp;-&nbsp;Reply</span>
          )}
          <ItemHoverMenu
            item={item}
            isMutable={isMutable}
            enterEditMode={() => setMaybeEditingItemId(item.id)}
            setMaybeDeleteItemModalElement={setMaybeDeleteItemModalElement}
            setMaybeReplyingToItemId={setMaybeReplyingToItemId}
          />
        </div>

        {isDeleted ? (
          <span
            css={css`
              font-style: italic;
              color: ${palette.neutral["46"]};
              font-size: 12px;
            `}
          >
            ITEM DELETED
          </span>
        ) : maybeEditingItemId === item.id ? (
          <EditItem item={item} cancel={() => setMaybeEditingItemId(null)} />
        ) : (
          <div>
            {item.type === "claim" ? (
              <div
                css={css`
                  padding: ${space[2]}px;
                  border: 1px solid ${composer.primary[300]};
                  border-radius: ${space[1]}px;
                  margin-left: -${space[9] - 4}px;
                  display: flex;
                  gap: ${space[1]}px;
                  color: ${composer.primary[300]};
                  ${agateSans.xxsmall({ fontWeight: "bold" })};
                  svg {
                    path {
                      fill: ${composer.primary[300]};
                    }
                  }
                `}
              >
                <Pencil />
                <div
                  css={css`
                    flex-grow: 1;
                    margin-top: -1px;
                  `}
                >
                  <span>
                    {item.userEmail === userEmail ? "You" : userDisplayName}{" "}
                    claimed{" "}
                    {isImmediatelyFollowingRelatedItem ? "the above" : "a"}{" "}
                    request&nbsp;
                    <Tick />
                  </span>
                  {maybeRelatedItem &&
                    !isImmediatelyFollowingRelatedItem &&
                    useMemo(
                      () => (
                        <div
                          css={css`
                            margin-top: ${space[2]}px;
                          `}
                        >
                          <NestedItemDisplay
                            item={maybeRelatedItem}
                            maybeUser={userLookup[maybeRelatedItem.userEmail]}
                            maybeScrollToItem={scrollToItem}
                          />
                        </div>
                      ),
                      [maybeRelatedItem.id]
                    )}
                </div>
              </div>
            ) : (
              <>
                {maybeRelatedItem &&
                  useMemo(
                    () => (
                      <Reply
                        item={maybeRelatedItem}
                        maybeUser={userLookup[maybeRelatedItem.userEmail]}
                        maybeScrollToItem={scrollToItem}
                      />
                    ),
                    [maybeRelatedItem.id]
                  )}
                {formattedMessage}
              </>
            )}
          </div>
        )}
        {payloadAndType && maybeEditingItemId !== item.id && (
          <PayloadDisplay payloadAndType={payloadAndType} tab="chat" />
        )}
      </div>
      {!isDeleted &&
        item.claimable &&
        useMemo(
          () => (
            <ClaimableItem
              item={item}
              userDisplayName={userDisplayName}
              claimItem={claimItem}
              maybeClaimedByName={
                maybeClaimedBy &&
                (userEmail === item.claimedByEmail
                  ? "you"
                  : `${maybeClaimedBy.firstName} ${maybeClaimedBy.lastName}`)
              }
            />
          ),
          [maybeClaimedBy, userDisplayName]
        )}
      {seenBy && <SeenBy seenBy={seenBy} userLookup={userLookup} />}
    </div>
  );
};
