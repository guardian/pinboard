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
import { useGlobalStateContext } from "../globalState";
import { SvgStar } from "@guardian/source-react-components";

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
        display: flex;
        align-items: flex-end;
        gap: ${space[1]}px;
        color: ${neutral[20]};
        cursor: ${maybeScrollToItem ? "pointer" : "initial"};
        position: relative;
        border-radius: 6px;
        &:hover {
          background-color: ${pinboard[500]};
          outline: 5px solid ${pinboard[500]};
        }
      `}
      onClick={
        maybeScrollToItem &&
        ((event) => {
          event.stopPropagation();
          event.preventDefault();
          setTimeout(() => maybeScrollToItem(item.id), 250);
        })
      }
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
  maybeStarredMessages: Item[] | undefined;
  userLookup: UserLookup;
  maybeScrollToItem: ((itemId: string) => void) | undefined;
}

const StarredMessages = ({
  maybeStarredMessages,
  userLookup,
  maybeScrollToItem,
}: StarredMessagesProps) => {
  const { setIsExpanded, setActiveTab } = useGlobalStateContext();
  return !maybeStarredMessages ? null : (
    <root.div>
      <div
        css={css`
          ${agateSans.xsmall()};
          outline: 15px solid ${pinboard[800]};
          border-radius: 6px;
          background-color: ${pinboard[800]};
          margin-bottom: 20px;
        `}
      >
        {maybeStarredMessages.length === 0 && (
          <span
            css={css`
              cursor: pointer;
            `}
            onClick={() => setIsExpanded(true)}
          >
            <strong>
              If you need to leave an important message please use Pinboard
              &apos;Starred Messages&apos; rather than notes.{" "}
            </strong>
            <br />
            Click here to open Pinboard, then simply send a message and then
            click the <SvgStar size="xsmall" /> to the left of your message. You
            can also star other&apos;s messages if you think they&apos;re
            important.
          </span>
        )}
        {maybeStarredMessages.map((item) => (
          <StarredItemDisplay
            key={item.id}
            item={item}
            userLookup={userLookup}
            maybeScrollToItem={
              maybeScrollToItem &&
              ((itemId: string) => {
                setIsExpanded(true);
                setActiveTab("chat");
                maybeScrollToItem(itemId);
              })
            }
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
