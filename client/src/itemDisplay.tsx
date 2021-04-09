/** @jsx jsx */
import { Item, User } from "../../shared/graphql/graphql";
import React, { Fragment } from "react";
import { css, jsx } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { space } from "@guardian/src-foundations";
import { userToMentionHandle } from "./util";
import differenceInMinutes from "date-fns/differenceInMinutes";
import format from "date-fns/format";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import isThisWeek from "date-fns/isThisWeek";
import isThisYear from "date-fns/isThisYear";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import differenceInHours from "date-fns/esm/differenceInHours";

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
}

export const ItemDisplay = ({
  item,
  refForLastItem,
  userLookup,
  userEmail,
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

  const formattedDateTime = () => {
    const dateInMillisecs = new Date(item.timestamp * 1000); // the AWS timestamp is in seconds
    const now = Date.now();
    if (isToday(dateInMillisecs)) {
      if (differenceInMinutes(now, dateInMillisecs) < 1) {
        return "Now";
      } else if (differenceInHours(now, dateInMillisecs) < 1) {
        return formatDistanceStrict(dateInMillisecs, now).slice(0, -4);
      }
      return format(dateInMillisecs, "HH:mm");
    } else if (isYesterday(dateInMillisecs)) {
      return format(dateInMillisecs, "'Yesterday' HH:mm");
    } else if (isThisWeek(dateInMillisecs)) {
      return format(dateInMillisecs, "eee HH:mm");
    } else if (isThisYear(dateInMillisecs)) {
      return format(dateInMillisecs, "d MMM HH:mm");
    } else {
      return format(dateInMillisecs, "d MMM yyyy HH:mm");
    }
  };

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
          justify-content: space-between;
          color: lightgray;
        `}
      >
        {/* TODO: add avatar as well */}
        <span>
          {user ? `${user.firstName} ${user.lastName}` : item.userEmail}
        </span>
        <span>{formattedDateTime()}</span>
      </div>
      <div>{formattedMessage}</div>
      {payload && <PayloadDisplay type={item.type} payload={payload} />}
    </div>
  );
};
