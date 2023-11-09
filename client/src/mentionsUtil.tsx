import { css } from "@emotion/react";
import { composer } from "../colours";
import React, { Fragment } from "react";
import {
  ChatBot,
  Group,
  MentionHandle,
  User,
} from "../../shared/graphql/graphql";

export const userToMentionHandle = (user: User) =>
  `@${user.firstName} ${user.lastName}`;

export const groupOrChatBotToMentionHandle = (
  groupOrChatBot: Group | ChatBot
) => `@${groupOrChatBot.shorthand}`;

const meMentionedCSS = (unread: boolean | undefined) => css`
  color: white;
  padding: 2px 4px;
  border-radius: 50px;
  background-color: ${unread ? composer.warning[300] : composer.primary[300]};
`;

const otherUserMentioned = css`
  color: ${composer.primary[300]};
`;

const linkifyText = (text: string) =>
  text.split(" ").reduce((acc, word) => {
    const formattedWord = word.startsWith("https://") ? (
      <a
        target="_blank"
        rel="noreferrer"
        href={word}
        css={css`
          color: ${composer.primary[300]};
          text-decoration: none;
          &:hover {
            text-decoration: underline;
          }
        `}
      >
        {word}
      </a>
    ) : (
      word
    );
    return (
      <>
        {acc} {formattedWord}
      </>
    );
  }, <></>);

export const formatMentionHandlesInText = (
  mentionHandles: MentionHandle[],
  text: string
): JSX.Element => {
  const [maybeMentionHandle, ...remainingMentions] = mentionHandles;
  if (maybeMentionHandle) {
    const formattedMentionHandle = (
      <strong
        css={
          //TODO consider different css for bots?
          maybeMentionHandle.isMe ? meMentionedCSS(false) : otherUserMentioned
        }
      >
        {maybeMentionHandle.isBot
          ? maybeMentionHandle.label.replace("@", "🤖") //TODO use svg here in future
          : maybeMentionHandle.label}
      </strong>
    );
    const partsBetweenMentionHandles = text.split(maybeMentionHandle.label);
    const formattedPartsBetweenMentionHandles = partsBetweenMentionHandles.map(
      (part) => formatMentionHandlesInText(remainingMentions, part)
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
  return <Fragment>{linkifyText(text)}</Fragment>;
};
