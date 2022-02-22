import { css } from "@emotion/react";
import React from "react";
import { LastItemSeenByUser, User } from "../../shared/graphql/graphql";
import { AvatarRoundel } from "./avatarRoundel";
import { formattedDateTime } from "./util";

interface SeenByProps {
  seenBy: LastItemSeenByUser[];
  userLookup: { [email: string]: User } | undefined;
}

export const SeenBy = ({ seenBy, userLookup }: SeenByProps) => (
  <div
    css={css`
      display: flex;
      align-items: center;
      justify-content: flex-end;
      font-size: 80%;
    `}
  >
    <span
      css={css`
        color: gray;
        margin-right: 5px;
      `}
    >
      Seen by
    </span>
    {seenBy.map(({ userEmail, seenAt }) => (
      <AvatarRoundel
        key={userEmail}
        maybeUser={userLookup?.[userEmail]}
        size={15}
        userEmail={userEmail}
        tooltipSuffix={` ${formattedDateTime(seenAt * 1000)}`}
      />
    ))}
  </div>
);
