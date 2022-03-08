import React from "react";
import { css } from "@emotion/react";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import { PayloadAndType } from "./types/PayloadAndType";
import { palette, space } from "@guardian/source-foundations";
import { PayloadDisplay } from "./payloadDisplay";
import { User } from "../../shared/graphql/graphql";
import { userToMentionHandle } from "./util";
import { AvatarRoundel } from "./avatarRoundel";
import { agateSans } from "../fontNormaliser";
import { scrollbarsCss } from "./styling";
interface WithEntity<E> {
  entity: E;
}

const mentionsDataProvider = (allUsers: User[]) => (token: string) => {
  const tokenLower = token.toLowerCase();
  return allUsers
    ?.filter(
      (_) =>
        _.firstName.toLowerCase().startsWith(tokenLower) ||
        _.lastName.toLowerCase().startsWith(tokenLower)
    )
    .slice(0, 5);
};

const UserSuggestion = ({ entity }: WithEntity<User>) => (
  <div
    css={css`
      display: flex;
    `}
  >
    <AvatarRoundel maybeUser={entity} size={20} userEmail={entity.email} />
    <div>
      <div>
        {entity.firstName} {entity.lastName}
      </div>
      <div
        css={css`
          font-size: 80%;
        `}
      >
        {entity.email}
      </div>
    </div>
  </div>
);

const isEnterKey = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === "Enter" || event.keyCode === 13;

interface CreateItemInputBoxProps {
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  message: string;
  setMessage: (newMessage: string) => void;
  sendItem: () => void;
  allUsers: User[] | undefined;
  addUnverifiedMention: (user: User) => void;
  panelElement: HTMLDivElement | null;
}

export const CreateItemInputBox = ({
  allUsers,
  payloadToBeSent,
  clearPayloadToBeSent,
  message,
  setMessage,
  sendItem,
  addUnverifiedMention,
  panelElement,
}: CreateItemInputBoxProps) => (
  <div
    css={css`
      flex-grow: 1;
      background-color: white;
      border-radius: ${space[1]}px;
      ${rtaStyles}
    `}
  >
    <ReactTextareaAutocomplete<User>
      trigger={
        allUsers
          ? {
              "@": {
                dataProvider: mentionsDataProvider(allUsers),
                component: UserSuggestion,
                output: userToMentionHandle, // TODO: ensure backspacing onto the lastName brings the prompt back up (the space is problematic)
              },
            }
          : {}
      }
      minChar={0}
      loadingComponent={() => <span>Loading</span>}
      placeholder="enter message here..."
      value={message}
      onChange={(event) => {
        event.target.style.height = "0";
        // Chrome will sometimes show a scrollbar at the exact scrollHeight, so give it a .1px extra as a nudge not to add one
        event.target.style.height = `${event.target.scrollHeight + 0.1}px`;
        setMessage(event.target.value);
      }}
      onKeyPress={(event) => {
        if (isEnterKey(event)) {
          if (message) {
            sendItem();
          }
          event.preventDefault();
        }
      }}
      onItemSelected={({ item }) => addUnverifiedMention(item)}
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
        max-height: 74px;
        ${agateSans.small({ lineHeight: "tight" })};
        resize: none;
        ${scrollbarsCss(palette.neutral[86])}
      `}
      autoFocus
      boundariesElement={panelElement || undefined}
    />
    {payloadToBeSent && (
      <PayloadDisplay
        {...payloadToBeSent}
        clearPayloadToBeSent={clearPayloadToBeSent}
      />
    )}
  </div>
);

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
    z-index: 1;
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
  }
  .rta__entity:hover {
    cursor: pointer;
  }
  .rta__item:not(:last-child) {
    border-bottom: 1px solid #dfe2e5;
  }
  .rta__entity > * {
    padding-left: 4px;
    padding-right: 4px;
  }
  .rta__entity--selected {
    color: #fff;
    text-decoration: none;
    background: #0366d6;
  }
`;
