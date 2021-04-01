/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/react";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import { PayloadAndType } from "./types/PayloadAndType";
import { space } from "@guardian/src-foundations";
import { PayloadDisplay } from "./payloadDisplay";
import { User } from "../../shared/graphql/graphql";
import { userToMentionHandle } from "./util";
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
    <img
      src={entity.avatarUrl || ""} // TODO: use generic silhouette rather than empty string
      css={css`
        border-radius: 50%;
        width: 20px;
        height: 20px;
        visibility: ${entity.avatarUrl ? "visible" : "hidden"};
      `}
    />
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

const payloadToBeSentThumbnailHeightPx = 50;

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
}

export const CreateItemInputBox = ({
  allUsers,
  payloadToBeSent,
  clearPayloadToBeSent,
  message,
  setMessage,
  sendItem,
  addUnverifiedMention,
}: CreateItemInputBoxProps) => (
  <div
    css={css`
      flex-grow: 1;
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
      onChange={(event) => setMessage(event.target.value)}
      onKeyPress={(event) =>
        isEnterKey(event) && message && sendItem() && event.preventDefault()
      }
      onItemSelected={({ item }) => addUnverifiedMention(item)}
      rows={2}
      css={css`
        padding-bottom: ${payloadToBeSent
          ? payloadToBeSentThumbnailHeightPx + 5
          : 0}px;
      `}
    />
    {payloadToBeSent && (
      <div
        css={css`
          position: absolute;
          bottom: ${space[1]}px;
          left: ${space[2]}px;
        `}
      >
        <PayloadDisplay
          {...payloadToBeSent}
          clearPayloadToBeSent={clearPayloadToBeSent}
          heightPx={payloadToBeSentThumbnailHeightPx}
        />
      </div>
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
