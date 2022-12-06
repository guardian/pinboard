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
import {
  buildPayloadAndType,
  isPayloadType,
  PayloadAndType,
} from "./types/PayloadAndType";
import { FormattedDateTime } from "./formattedDateTime";
import * as Sentry from "@sentry/react";
import { UserLookup } from "./types/UserLookup";
import { FetchResult } from "@apollo/client";
import { ClaimableItem } from "./claimableItem";
import { NestedItemDisplay } from "./nestedItemDisplay";
import { formatMentionHandlesInText } from "./mentionsUtil";
import Tick from "../icons/tick.svg";
import { composer } from "../colours";
import Pencil from "../icons/pencil.svg";

const maybeConstructPayloadAndType = (
  type: string,
  payload: string | null | undefined
): PayloadAndType | undefined => {
  if (!isPayloadType(type) || !payload) {
    return;
  }

  const payloadAndType = buildPayloadAndType(type, JSON.parse(payload));

  if (!payloadAndType) {
    Sentry.captureException(
      new Error(`Failed to parse payload with type=${type}, payload=${payload}`)
    );
  }

  return payloadAndType;
};

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
    [item.id]
  );

  const dateInMillisecs = new Date(item.timestamp).valueOf();

  const isDifferentUserFromPreviousItem =
    maybePreviousItem?.userEmail !== item.userEmail;

  const maybeClaimedBy = useMemo(
    () => item.claimedByEmail && userLookup[item.claimedByEmail],
    [item.claimedByEmail, userLookup]
  );

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
            color: ${palette.neutral["20"]};
            ${agateSans.xxsmall({ lineHeight: "tight" })};
            margin-bottom: 2px;
          `}
        >
          <FormattedDateTime timestamp={dateInMillisecs} />
        </div>
        <div>
          {item.type === "claim" ? (
            <div
              css={css`
                padding: ${space[2]}px;
                border: 1px solid ${composer.primary[300]};
                border-radius: ${space[1]}px;
                margin-left: -${space[9] - 4}px;
              `}
            >
              <span
                css={css`
                  color: ${composer.primary[300]};
                  svg {
                    path {
                      fill: ${composer.primary[300]};
                    }
                  }
                  ${agateSans.xxsmall({ fontWeight: "bold" })};
                `}
              >
                <Pencil /> {userDisplayName} claimed a request <Tick />
              </span>
              {maybeRelatedItem &&
                useMemo(
                  () => (
                    <NestedItemDisplay
                      item={maybeRelatedItem}
                      maybeUser={userLookup[maybeRelatedItem.userEmail]}
                      scrollToItem={scrollToItem}
                    />
                  ),
                  [maybeRelatedItem.id]
                )}
            </div>
          ) : (
            formattedMessage
          )}
        </div>
        {payloadAndType && (
          <PayloadDisplay payloadAndType={payloadAndType} tab="chat" />
        )}
      </div>
      {item.claimable &&
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
          [maybeClaimedBy]
        )}
      {seenBy && <SeenBy seenBy={seenBy} userLookup={userLookup} />}
    </div>
  );
};
