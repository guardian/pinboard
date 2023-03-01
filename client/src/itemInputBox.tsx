import React, { useEffect, useLayoutEffect, useRef } from "react";
import { css } from "@emotion/react";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import { PayloadAndType } from "./types/PayloadAndType";
import { palette, space } from "@guardian/source-foundations";
import { PayloadDisplay } from "./payloadDisplay";
import { Group, User } from "../../shared/graphql/graphql";
import { AvatarRoundel } from "./avatarRoundel";
import { agateSans } from "../fontNormaliser";
import { scrollbarsCss } from "./styling";
import { composer } from "../colours";
import { useApolloClient } from "@apollo/client";
import { gqlSearchMentionableUsers } from "../gql";
import { SvgSpinner } from "@guardian/source-react-components";
import { isGroup, isUser } from "../../shared/graphql/extraTypes";
import { groupToMentionHandle, userToMentionHandle } from "./mentionsUtil";

interface WithEntity<E> {
  entity: E & {
    heading?: string;
  };
}

const LoadingSuggestions = () => (
  <div
    css={css`
      display: flex;
      align-items: center;
      gap: ${space["2"]}px;
      background: ${palette.neutral["100"]};
      padding: ${space["2"]}px;
      font-family: ${agateSans.small({ lineHeight: "tight" })};
    `}
  >
    <SvgSpinner size="xsmall" />
    <span>loading</span>
  </div>
);

const Suggestion = ({
  entity: { heading, ...userOrGroup },
}: WithEntity<User | Group>) => (
  <div>
    {heading && (
      <div
        css={css`
          cursor: default;
          padding: ${space[1]}px;
          background: ${palette.neutral["93"]};
          font-family: ${agateSans.xxsmall({ fontWeight: "bold" })};
          color: ${palette.neutral["46"]};
          user-select: none;
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {heading}
      </div>
    )}
    <div
      title={
        isGroup(userOrGroup) ? userOrGroup.memberEmails?.join("\n") : undefined
      }
      css={css`
        display: flex;
        cursor: pointer;
        padding: ${space[1]}px ${space[2]}px;
      `}
    >
      <div css={{ paddingRight: `${space[1]}px` }}>
        <AvatarRoundel
          maybeUserOrGroup={userOrGroup}
          size={28}
          fallback={isUser(userOrGroup) ? userOrGroup.email : userOrGroup.name}
        />
      </div>
      <div>
        <div
          css={{
            fontFamily: agateSans.xsmall({
              lineHeight: "tight",
              fontWeight: "bold",
            }),
          }}
        >
          {isUser(userOrGroup)
            ? `${userOrGroup.firstName} ${userOrGroup.lastName}`
            : userOrGroup.shorthand}
        </div>
        <div
          css={{
            fontFamily: agateSans.xxsmall({ lineHeight: "tight" }),
          }}
        >
          {isUser(userOrGroup) ? userOrGroup.email : userOrGroup.name}
        </div>
      </div>
    </div>
  </div>
);

const isEnterKey = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === "Enter" || event.keyCode === 13;

interface ItemInputBoxProps {
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  message: string;
  setMessage: (newMessage: string) => void;
  sendItem?: () => void;
  addUnverifiedMention?: (userOrGroup: User | Group) => void;
  panelElement: HTMLElement | null;
  isSending: boolean;
}

export const ItemInputBox = ({
  payloadToBeSent,
  clearPayloadToBeSent,
  message,
  setMessage,
  sendItem,
  addUnverifiedMention,
  panelElement,
  isSending,
}: ItemInputBoxProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>();

  useLayoutEffect(() => {
    if (!isSending) {
      textAreaRef.current?.focus();
    }
  }, [isSending]);

  const apolloClient = useApolloClient();

  const mentionsDataProvider = (token: string) =>
    apolloClient
      .query({
        query: gqlSearchMentionableUsers(token),
        context: { debounceKey: "user-search", debounceTimeout: 250 },
      })
      .then(({ data: { searchMentionableUsers: { users, groups } } }) => [
        ...users.map((user: User, index: number) => ({
          ...user,
          heading: index === 0 ? "INDIVIDUALS" : undefined,
        })),
        ...groups.map((group: Group, index: number) => ({
          ...group,
          heading: index === 0 ? "GROUPS" : undefined,
        })),
      ]);

  useEffect(
    () => /* unmount handler */ () => {
      textAreaRef.current?.blur();
    },
    []
  );

  const resizeTextArea = (target: HTMLTextAreaElement) => {
    target.style.height = "0";
    // Chrome will sometimes show a scrollbar at the exact scrollHeight, so give it a .1px extra as a nudge not to add one
    target.style.height = `${target.scrollHeight + 0.1}px`;
  };

  return (
    <div
      css={css`
        flex-grow: 1;
        background-color: white;
        border-radius: ${space[1]}px;
        padding-bottom: 0.1px;
        ${rtaStyles}
      `}
    >
      <ReactTextareaAutocomplete<User | Group>
        innerRef={(element) => (textAreaRef.current = element)}
        disabled={isSending}
        trigger={{
          "@": {
            dataProvider: addUnverifiedMention
              ? mentionsDataProvider
              : () => [],
            component: Suggestion,
            output: (userOrGroup) => ({
              key: isGroup(userOrGroup)
                ? userOrGroup.shorthand
                : userOrGroup.email,
              text: isGroup(userOrGroup)
                ? groupToMentionHandle(userOrGroup)
                : userToMentionHandle(userOrGroup),
              caretPosition: "next",
            }),
            allowWhitespace: true,
          },
        }}
        minChar={0}
        loadingComponent={LoadingSuggestions}
        placeholder="enter message here..."
        value={message}
        onFocus={({ target }) => resizeTextArea(target)}
        onChange={(event) => {
          resizeTextArea(event.target);
          setMessage(event.target.value);
        }}
        onKeyPress={
          sendItem &&
          ((event) => {
            event.stopPropagation();
            if (isEnterKey(event)) {
              if (message || payloadToBeSent) {
                sendItem();
              }
              event.preventDefault();
            }
          })
        }
        onItemSelected={({ item }) => addUnverifiedMention?.(item)}
        rows={1}
        css={css`
          box-sizing: border-box;
          background-color: transparent;
          border: none;
          vertical-align: middle;
          &:focus-visible {
            outline: none;
          }
          /* Firefox needs this hint to get the correct initial height.
           Chrome will sometimes show a scrollbar at 21px, so give it a .1px extra as a nudge not to add one */
          height: 21.1px;
          ${addUnverifiedMention ? "max-height: 74px;" : ""}
          ${agateSans.small({ lineHeight: "tight" })};
          resize: none;
          ${scrollbarsCss(palette.neutral[86])}
        `}
        boundariesElement={panelElement || undefined}
      />
      {payloadToBeSent && (
        <div
          css={css`
            margin: 0 ${space[1]}px;
          `}
        >
          <PayloadDisplay
            payloadAndType={payloadToBeSent}
            clearPayloadToBeSent={clearPayloadToBeSent}
          />
        </div>
      )}
    </div>
  );
};

const rtaStyles = css`
  .rta {
    position: relative;
    width: 100%;
  }
  .rta__loader.rta__loader--empty-suggestion-data {
    border-radius: 3px;
    box-shadow: 0 0 5px rgba(27, 31, 35, 0.1);
    padding: 5px;
  }
  .rta--loading .rta__loader.rta__loader--suggestion-data {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
  }
  .rta--loading .rta__loader.rta__loader--suggestion-data > * {
    position: relative;
    top: 50%;
  }
  .rta__textarea {
    width: 100%;
  }
  .rta__autocomplete {
    position: absolute;
    display: block;
    margin-top: 16px;
    z-index: 999999;
  }
  .rta__autocomplete--top {
    margin-top: 0;
    margin-bottom: 16px;
  }
  .rta__list {
    margin: 0;
    padding: 0;
    background: #fff;
    border: 1px solid #dfe2e5;
    border-radius: 3px;
    box-shadow: 0 0 5px rgba(27, 31, 35, 0.1);
    list-style: none;
  }
  .rta__entity {
    background: white;
    width: 100%;
    text-align: left;
    outline: none;
    color: ${palette.neutral[20]};
  }
  .rta__item:not(:last-child) {
    border-bottom: 1px solid #dfe2e5;
  }
  .rta__entity--selected {
    color: ${palette.neutral["100"]};
    text-decoration: none;
    background: ${composer.primary["300"]};
  }
`;