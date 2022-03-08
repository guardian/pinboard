import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import { SvgPerson } from "@guardian/source-react-components";
import React from "react";
import { User } from "../../shared/graphql/graphql";
import { composer } from "../colours";

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
    <span
      css={css`
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${composer.primary[300]};
        fill: ${neutral[100]};
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <SvgPerson size="xsmall" />
    </span>
  );
};
