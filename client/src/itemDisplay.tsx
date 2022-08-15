import { Item, LastItemSeenByUser, User } from "../../shared/graphql/graphql";
import React, { Fragment } from "react";
import { css } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { palette, space } from "@guardian/source-foundations";
import { userToMentionHandle } from "./util";
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

const userMentioned = (unread: boolean | undefined) => css`
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
  userEmail: string,
  mentions: User[],
  text: string
): JSX.Element => {
  const [mentionUser, ...remainingMentions] = mentions;
  if (mentionUser) {
    const mentionHandle = userToMentionHandle(mentionUser);
    const formattedMentionHandle = (
      <strong
        css={
          userEmail === mentionUser.email
            ? userMentioned(false)
            : otherUserMentioned
        }
      >
        {mentionHandle}
      </strong>
    );
    const partsBetweenMentionHandles = text.split(mentionHandle);
    const formattedPartsBetweenMentionHandles = partsBetweenMentionHandles.map(
      (part) => formatMentionHandlesInText(userEmail, remainingMentions, part)
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
  refForLastItem: React.RefObject<HTMLDivElement> | undefined;
  userLookup: { [email: string]: User } | undefined;
  userEmail: string;
  seenBy: LastItemSeenByUser[] | undefined;
  maybePreviousItem: Item | PendingItem | undefined;
}

export const ItemDisplay = ({
  item,
  refForLastItem,
  userLookup,
  userEmail,
  seenBy,
  maybePreviousItem,
}: ItemDisplayProps) => {
  const user = userLookup?.[item.userEmail];
  const payloadAndType = maybeConstructPayloadAndType(item.type, item.payload);
  const isPendingSend = "pending" in item && item.pending;
  const mentions = item.mentions
    ?.map((mentionEmail) => userLookup?.[mentionEmail])
    .filter((mentionUser): mentionUser is User => !!mentionUser);

  const formattedMessage =
    !item.message || !mentions
      ? item.message
      : formatMentionHandlesInText(userEmail, mentions, item.message);

  const dateInMillisecs = new Date(item.timestamp * 1000).valueOf(); // the AWS timestamp is in seconds

  const isDifferentUserFromPreviousItem =
    maybePreviousItem?.userEmail !== item.userEmail;

  return (
    <div
      ref={refForLastItem}
      css={css`
        padding-bottom: ${space[1]}px;
        margin-bottom: ${space[1]}px;
        font-style: ${isPendingSend ? "italic" : "normal"};
        ${agateSans.small({ lineHeight: "tight" })};
        color: ${palette.neutral[20]};
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
              maybeUser={user}
              size={28}
              userEmail={item.userEmail}
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
        <div
          css={css`
            color: ${palette.neutral["20"]};
            ${agateSans.xxsmall({ lineHeight: "tight" })};
            margin-bottom: 2px;
          `}
        >
          <FormattedDateTime timestamp={dateInMillisecs} />
        </div>
        <div>{formattedMessage}</div>
        {payloadAndType && (
          <PayloadDisplay payloadAndType={payloadAndType} tab="chat" />
        )}
      </div>
      {seenBy && <SeenBy seenBy={seenBy} userLookup={userLookup} />}
    </div>
  );
};
