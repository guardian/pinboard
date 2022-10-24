import {
  Claimed,
  Item,
  LastItemSeenByUser,
  MentionHandle,
} from "../../shared/graphql/graphql";
import React, { Fragment } from "react";
import { css } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { palette, space } from "@guardian/source-foundations";
import { SeenBy } from "./seenBy";
import { AvatarRoundel } from "./avatarRoundel";
import { agateSans } from "../fontNormaliser";
import { composer } from "../colours";
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

const meMentionedCSS = (unread: boolean | undefined) => css`
  color: white;
  padding: 2px 4px;
  border-radius: 50px;
  background-color: ${unread ? composer.warning[300] : composer.primary[300]};
`;

const otherUserMentioned = css`
  color: ${composer.primary[300]};
`;

const formattedText = (text: string) =>
  text.split(" ").reduce((acc, word) => {
    const formattedWord = word.startsWith("https://") ? (
      <a
        target="_blank"
        rel="noreferrer"
        href={word}
        css={css`
          color: ${composer.primary[300]};
          text-decoration: none;
          &:hover {
            text-decoration: underline;
          }
        `}
      >
        {word}
      </a>
    ) : (
      word
    );
    return (
      <>
        {acc} {formattedWord}
      </>
    );
  }, <></>);

const formatMentionHandlesInText = (
  mentionHandles: MentionHandle[],
  text: string
): JSX.Element => {
  const [maybeMentionHandle, ...remainingMentions] = mentionHandles;
  if (maybeMentionHandle) {
    const formattedMentionHandle = (
      <strong
        css={
          maybeMentionHandle.isMe ? meMentionedCSS(false) : otherUserMentioned
        }
      >
        {maybeMentionHandle.label}
      </strong>
    );
    const partsBetweenMentionHandles = text.split(maybeMentionHandle.label);
    const formattedPartsBetweenMentionHandles = partsBetweenMentionHandles.map(
      (part) => formatMentionHandlesInText(remainingMentions, part)
    );
    return formattedPartsBetweenMentionHandles.reduce(
      (result, formattedPart) => (
        <Fragment>
          {result}
          {formattedMentionHandle}
          {formattedPart}
        </Fragment>
      )
    );
  }
  return <Fragment>{formattedText(text)}</Fragment>;
};

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
  scrollToBottomIfApplicable: () => void;
  claimItem: () => Promise<FetchResult<{ claimItem: Claimed }>>;
  maybeClaimedItem: Item | false | undefined;
  userEmail: string;
}

export const ItemDisplay = ({
  item,
  userLookup,
  seenBy,
  maybePreviousItem,
  scrollToBottomIfApplicable,
  claimItem,
  maybeClaimedItem,
  userEmail,
}: ItemDisplayProps) => {
  const user = userLookup?.[item.userEmail];
  const payloadAndType = maybeConstructPayloadAndType(item.type, item.payload);
  const isPendingSend = "pending" in item && item.pending;

  const mentionHandles = [
    ...(item.mentions || []),
    ...(item.groupMentions || []),
  ];

  const formattedMessage =
    item.message && formatMentionHandlesInText(mentionHandles, item.message);

  const dateInMillisecs = new Date(item.timestamp).valueOf();

  const isDifferentUserFromPreviousItem =
    maybePreviousItem?.userEmail !== item.userEmail;

  return (
    <div
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
              {user ? `${user.firstName} ${user.lastName}` : item.userEmail}
            </span>
          </React.Fragment>
        )}
      </div>
      <div
        css={css`
          margin-left: ${space[9] - 4}px;
        `}
      >
        {item.type !== "claim" && ( // FIXME - Should we show claims as an item?
          <div
            css={css`
              color: ${palette.neutral["20"]};
              ${agateSans.xxsmall({ lineHeight: "tight" })};
              margin-bottom: 2px;
            `}
          >
            <FormattedDateTime timestamp={dateInMillisecs} />
          </div>
        )}
        <div>{formattedMessage}</div>
        {payloadAndType && (
          <PayloadDisplay
            payloadAndType={payloadAndType}
            tab="chat"
            scrollToBottomIfApplicable={scrollToBottomIfApplicable}
          />
        )}
      </div>
      {item.claimable && (
        <ClaimableItem
          item={item}
          userEmail={userEmail}
          userLookup={userLookup}
          claimItem={claimItem}
          maybeClaimedItem={maybeClaimedItem}
        />
      )}
      {seenBy && <SeenBy seenBy={seenBy} userLookup={userLookup} />}
    </div>
  );
};
