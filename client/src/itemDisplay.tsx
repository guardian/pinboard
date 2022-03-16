import { Item, LastItemSeenByUser, User } from "../../shared/graphql/graphql";
import React, { Fragment } from "react";
import { css } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { neutral, palette, space } from "@guardian/source-foundations";
import { formattedDateTime, userToMentionHandle } from "./util";
import { SeenBy } from "./seenBy";
import { AvatarRoundel } from "./avatarRoundel";
import { agateSans } from "../fontNormaliser";
import { composer } from "../colours";

const userMentioned = (unread: boolean | undefined) => css`
  color: white;
  padding: 2px 4px;
  border-radius: 50px;
  background-color: ${unread ? composer.warning[300] : composer.primary[300]};
`;

const otherUserMentioned = css`
  color: ${composer.primary[300]};
`;

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
  return <Fragment>{text}</Fragment>;
};
interface ItemDisplayProps {
  item: Item | PendingItem;
  refForLastItem: React.RefObject<HTMLDivElement> | undefined;
  userLookup: { [email: string]: User } | undefined;
  userEmail: string;
  timestampLastRefreshed: number;
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
  const payload = item.payload && JSON.parse(item.payload);
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
            color: ${palette.neutral["46"]};
            ${agateSans.xxsmall({ lineHeight: "tight" })};
            margin-bottom: 2px;
          `}
        >
          {formattedDateTime(dateInMillisecs)}
        </div>
        <div>{formattedMessage}</div>
        {payload && (
          <div
            css={css`
              margin: ${space[1]}px;
              border: 1px solid ${neutral[86]};
              border-radius: ${space[1]}px;
              max-width: fit-content;
              &:hover {
                background-color: ${neutral[86]};
              }
            `}
          >
            <PayloadDisplay type={item.type} payload={payload} />
          </div>
        )}
      </div>
      {seenBy && <SeenBy seenBy={seenBy} userLookup={userLookup} />}
    </div>
  );
};
