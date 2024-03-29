import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import React from "react";
import { Group, User } from "../../shared/graphql/graphql";
import { composer } from "../colours";
import { agateSans } from "../fontNormaliser";
import { isUser } from "../../shared/graphql/extraTypes";

interface AvatarRoundelProps {
  maybeUserOrGroup: User | Group | undefined;
  size: number;
  fallback: string;
}

export const AvatarRoundel = ({
  maybeUserOrGroup,
  size,
  fallback,
}: AvatarRoundelProps) =>
  maybeUserOrGroup && isUser(maybeUserOrGroup) && maybeUserOrGroup.avatarUrl ? (
    <img
      key={fallback}
      css={css`
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
      `}
      src={maybeUserOrGroup.avatarUrl}
      draggable={false}
    />
  ) : (
    <span
      css={css`
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        box-shadow: 0 0 1px ${neutral[93]};
        background-color: ${composer.primary[300]};
        color: ${neutral[100]};
        display: flex;
        flex-shrink: 0;
        user-select: none;
        justify-content: center;
        ${size < 20 // arbitrary breakpoint
          ? `${agateSans.xxsmall()} font-size: 10px;`
          : agateSans.small()}
        line-height: ${size}px;
      `}
    >
      {maybeUserOrGroup ? (
        isUser(maybeUserOrGroup) ? (
          <React.Fragment>
            {maybeUserOrGroup.firstName.charAt(0).toUpperCase()}
            {maybeUserOrGroup.lastName?.charAt(0).toUpperCase()}
          </React.Fragment>
        ) : (
          maybeUserOrGroup.memberEmails?.length
        )
      ) : (
        fallback.charAt(0).toUpperCase()
      )}
    </span>
  );
