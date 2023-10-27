import React from "react";
import ReactDOM from "react-dom";
import { Item } from "shared/graphql/graphql";
import root from "react-shadow/emotion";
import { UserLookup } from "../types/UserLookup";
import { FormattedDateTime } from "../formattedDateTime";
import { css } from "@emotion/react";
import { agateSans } from "../../fontNormaliser";
import { neutral, space } from "@guardian/source-foundations";
import { pinboard } from "../../colours";

export const STARRED_MESSAGES_HTML_TAG = "pinboard-starred-messages";

const StarredItemDisplay = ({
  item,
  userLookup,
  maybeScrollToItem,
}: {
  item: Item;
  userLookup: UserLookup;
  maybeScrollToItem: ((itemId: string) => void) | undefined;
}) => {
  const user = userLookup?.[item.userEmail];
  const userDisplayName = user
    ? `${user.firstName} ${user.lastName}`
    : item.userEmail;
  return (
    <div
      css={css`
        ${agateSans.xsmall()};
        display: flex;
        align-items: flex-end;
        gap: ${space[1]}px;
        color: ${neutral[20]};
        cursor: pointer;
        position: relative;
        border-radius: 6px;
        &:hover {
          background-color: ${pinboard[500]};
          outline: 5px solid ${pinboard[500]};
        }
      `}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        console.log(item, maybeScrollToItem);
        maybeScrollToItem?.(item.id);
      }}
    >
      <span
        css={css`
          color: ${neutral[0]};
          ${agateSans.medium()};
        `}
      >
        {item.message}
      </span>
      <span title={item.userEmail}>{userDisplayName}</span>
      <span>
        <FormattedDateTime timestamp={item.timestamp} withAgo />
      </span>
    </div>
  );
};

interface StarredMessagesProps {
  starredMessages: Item[];
  userLookup: UserLookup;
  maybeScrollToItem: ((itemId: string) => void) | undefined;
}

const StarredMessages = ({
  starredMessages,
  userLookup,
  maybeScrollToItem,
}: StarredMessagesProps) => {
  return starredMessages.length === 0 ? null : (
    <root.div>
      <div
        css={css`
          outline: 15px solid ${pinboard[800]};
          border-radius: 6px;
          background-color: ${pinboard[800]};
          margin-bottom: 20px;
        `}
      >
        {starredMessages.map((item) => (
          <StarredItemDisplay
            key={item.id}
            item={item}
            userLookup={userLookup}
            maybeScrollToItem={maybeScrollToItem}
          />
        ))}
      </div>
    </root.div>
  );
};

interface StarredMessagesPortalProps extends StarredMessagesProps {
  node: Element;
}

export const StarredMessagesPortal = ({
  node,
  ...props
}: StarredMessagesPortalProps) =>
  ReactDOM.createPortal(<StarredMessages {...props} />, node);
