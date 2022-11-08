import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import React from "react";
import { Group, User } from "../../shared/graphql/graphql";
import { composer } from "../colours";
import { openSans } from "../fontNormaliser";
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
        border: 1px solid ${neutral[93]};
        background-color: ${composer.primary[300]};
        color: ${neutral[100]};
        display: flex;
        flex-shrink: 0;
        user-select: none;
        justify-content: center;
        ${size < 20 // arbitrary breakpoint
          ? `${openSans.xxsmall()} font-size: 10px;`
          : openSans.small()}
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
