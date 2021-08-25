/** @jsx jsx */
import { Item, LastItemSeenByUser, User } from "../../shared/graphql/graphql";
import React, { Fragment } from "react";
import { css, jsx } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { palette, space } from "@guardian/src-foundations";
import { formattedDateTime, userToMentionHandle } from "./util";
import { SeenBy } from "./seenBy";
import { AvatarRoundel } from "./avatarRoundel";

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
          userEmail === mentionUser.email &&
          css`
            color: white;
            padding: 2px 4px 0 2px;
            border-radius: 50px;
            background-color: red;
          `
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
}

export const ItemDisplay = ({
  item,
  refForLastItem,
  userLookup,
  userEmail,
  seenBy,
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

  return (
    <div
      ref={refForLastItem}
      css={css`
        border-bottom: 1px solid gray;
        padding-bottom: ${space[1]}px;
        margin-bottom: ${space[1]}px;
        font-style: ${isPendingSend ? "italic" : "normal"};
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
          color: ${palette.neutral["46"]};
          font-size: 12px;
          line-height: 12px;
        `}
      >
        <AvatarRoundel maybeUser={user} size={15} userEmail={item.userEmail} />
        <span
          css={css`
            flex-grow: 1;
            margin-left: 3px;
          `}
        >
          {user ? `${user.firstName} ${user.lastName}` : item.userEmail}
        </span>
        <span>{formattedDateTime(dateInMillisecs)}</span>
      </div>
      <div>{formattedMessage}</div>
      {payload && <PayloadDisplay type={item.type} payload={payload} />}
      {seenBy && <SeenBy seenBy={seenBy} userLookup={userLookup} />}
    </div>
  );
};
