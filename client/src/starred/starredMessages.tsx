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
    ? `${user.firstName} ${user.lastName}` // TODO: Non-breaking space
    : item.userEmail;
  return (
    <div
      css={css`
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
          white-space: pre-line;
        `}
      >
        {item.message}
      </span>
      <span css={detailCSS} title={item.userEmail}>
        {userDisplayName}
      </span>
      <span css={detailCSS}>
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
          display: flex;
          flex-direction: column;
          gap: ${space[3]}px;
          cursor: pointer;
        `}
        onClick={() => setIsExpanded(true)}
      >
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
        <span>
          <strong>
            If you need to leave an important message please use Pinboard
            &apos;Starred Messages&apos; rather than notes.{" "}
          </strong>
          <br />
          Click here to open Pinboard, then simply send a message and then click
          the <SvgStar size="xsmall" /> to the left of your message.
          <br />
          You can also star other&apos;s messages if you think they&apos;re
          important.
        </span>
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

const detailCSS = css`
  margin-left: 7px;
  vertical-align: sub;
`;
