/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import React from "react";
import { User } from "../../shared/graphql/graphql";

interface AvatarRoundelProps {
  maybeUser: User | undefined;
  size: number;
  userEmail: string;
  tooltipSuffix?: string;
}

export const AvatarRoundel = ({
  maybeUser,
  size,
  userEmail,
  tooltipSuffix,
}: AvatarRoundelProps) => {
  const tooltip = `${
    maybeUser ? `${maybeUser.firstName} ${maybeUser.lastName}` : userEmail
  }${tooltipSuffix || ""}`;

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
    <div
      key={userEmail}
      title={tooltip}
      css={css`
        background-color: #586293;
        border-radius: 50%;
        color: white;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        font-size: ${size / 2}px;
        line-height: ${size / 2}px;
      `}
    >
      {(maybeUser?.firstName || userEmail).charAt(0).toUpperCase()}
      {maybeUser?.lastName?.charAt(0).toUpperCase()}
    </div>
  );
};
