import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import React from "react";
import { User } from "../../shared/graphql/graphql";
import { composer } from "../colours";
import { agateSans } from "../fontNormaliser";

interface AvatarRoundelProps {
  maybeUser: User | undefined;
  size: number;
  userEmail: string;
  shouldHideTooltip?: true;
}

export const AvatarRoundel = ({
  maybeUser,
  size,
  userEmail,
  shouldHideTooltip,
}: AvatarRoundelProps) => {
  const tooltip = shouldHideTooltip
    ? undefined
    : `${
        maybeUser ? `${maybeUser.firstName} ${maybeUser.lastName}` : userEmail
      }`;

  return maybeUser?.avatarUrl ? (
    <img
      key={userEmail}
      css={css`
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
      `}
      title={tooltip}
      src={maybeUser?.avatarUrl}
    />
  ) : (
    <span
      title={tooltip}
      css={css`
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${composer.primary[300]};
        color: ${neutral[100]};
        display: flex;
        flex-shrink: 0;
        user-select: none;
        justify-content: center;
        align-items: center;
        ${size < 20 // arbitrary breakpoint
          ? agateSans.xxsmall()
          : agateSans.small()}
      `}
    >
      {(maybeUser?.firstName || userEmail).charAt(0).toUpperCase()}
      {maybeUser?.lastName?.charAt(0).toUpperCase()}
    </span>
  );
};
