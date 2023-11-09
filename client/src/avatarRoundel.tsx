import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import React from "react";
import { ChatBot, Group, User } from "../../shared/graphql/graphql";
import { composer } from "../colours";
import { agateSans } from "../fontNormaliser";
import {
  hasAvatarUrl,
  isChatBot,
  isGroup,
  isUser,
} from "../../shared/graphql/extraTypes";

interface AvatarRoundelProps {
  maybeUserOrGroupOrChatBot: User | Group | ChatBot | undefined;
  size: number;
  fallback: string;
}

export const AvatarRoundel = ({
  maybeUserOrGroupOrChatBot,
  size,
  fallback,
}: AvatarRoundelProps) =>
  hasAvatarUrl(maybeUserOrGroupOrChatBot) &&
  maybeUserOrGroupOrChatBot.avatarUrl ? (
    <img
      key={fallback}
      css={css`
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
      `}
      src={maybeUserOrGroupOrChatBot.avatarUrl}
      draggable={false}
    />
  ) : (
    <span
      css={css`
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        box-shadow: 0 0 1px ${neutral[93]};
        background-color: ${isChatBot(maybeUserOrGroupOrChatBot)
          ? "none"
          : composer.primary[300]};
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
      {isUser(maybeUserOrGroupOrChatBot) && (
        <React.Fragment>
          {maybeUserOrGroupOrChatBot.firstName.charAt(0).toUpperCase()}
          {maybeUserOrGroupOrChatBot.lastName?.charAt(0).toUpperCase()}
        </React.Fragment>
      )}
      {isGroup(maybeUserOrGroupOrChatBot) &&
        maybeUserOrGroupOrChatBot.memberEmails?.length}
      {isChatBot(maybeUserOrGroupOrChatBot) && (
        <span>🤖</span> /* TODO replace with actual bot SVG */
      )}
      {!maybeUserOrGroupOrChatBot && fallback.charAt(0).toUpperCase()}
    </span>
  );
