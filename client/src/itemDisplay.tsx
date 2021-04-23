/** @jsx jsx */
import { Item, User } from "../../shared/graphql/graphql";
import React, { Fragment } from "react";
import { css, jsx } from "@emotion/react";
import { PayloadDisplay } from "./payloadDisplay";
import { PendingItem } from "./types/PendingItem";
import { space } from "@guardian/src-foundations";
import { formattedDateTime, userToMentionHandle } from "./util";

const formatMentionHandlesInText = (
  userEmail: string,
  mentions: User[],
  text: string
): JSX.Element => {
  const [mentionUser, ...remainingMentions] = mentions;
  if (mentionUser) {
    const mentionHandle = userToMentionHandle(mentionUser);
    const formattedMentionHandle = (
      <strong
        css={
          userEmail === mentionUser.email &&
          css`
            color: white;
            padding: 2px 4px 0 2px;
            border-radius: 50px;
            background-color: red;
          `
        }
      >
        {mentionHandle}
      </strong>
    );
    const partsBetweenMentionHandles = text.split(mentionHandle);
    const formattedPartsBetweenMentionHandles = partsBetweenMentionHandles.map(
      (part) => formatMentionHandlesInText(userEmail, remainingMentions, part)
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
  return <Fragment>{text}</Fragment>;
};
interface ItemDisplayProps {
  item: Item | PendingItem;
  refForLastItem: React.RefObject<HTMLDivElement> | undefined;
  userLookup: { [email: string]: User } | undefined;
  userEmail: string;
  timestampLastRefreshed: number;
  assetUsageNodes: HTMLElement[];
}

export const ItemDisplay = ({
  item,
  refForLastItem,
  userLookup,
  userEmail,
  assetUsageNodes,
}: ItemDisplayProps) => {
  const user = userLookup?.[item.userEmail];
  const payload = item.payload && JSON.parse(item.payload);
  const isPendingSend = "pending" in item && item.pending;
  const mentions = item.mentions
    ?.map((mentionEmail) => userLookup?.[mentionEmail])
    .filter((mentionUser): mentionUser is User => !!mentionUser);

  const maybeUsages =
    payload &&
    assetUsageNodes.filter(
      (usageNode) =>
        usageNode?.dataset?.assetId &&
        payload.thumbnail?.includes(usageNode?.dataset?.assetId)
    );

  const formattedMessage =
    !item.message || !mentions
      ? item.message
      : formatMentionHandlesInText(userEmail, mentions, item.message);

  const dateInMillisecs = new Date(item.timestamp * 1000).valueOf(); // the AWS timestamp is in seconds

  const maybeOctopusImagingOrderType = payload?.octopusImagingOrderType;

  return (
    <div
      ref={refForLastItem}
      css={css`
        border-bottom: 1px solid gray;
        padding-bottom: ${space[1]}px;
        margin-bottom: ${space[1]}px;
        font-style: ${isPendingSend ? "italic" : "normal"};
      `}
    >
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          color: lightgray;
        `}
      >
        {/* TODO: add avatar as well */}
        <span>
          {user ? `${user.firstName} ${user.lastName}` : item.userEmail}
        </span>
        <span>{formattedDateTime(dateInMillisecs)}</span>
      </div>
      {maybeOctopusImagingOrderType && (
        <div
          css={css`
            font-style: italic;
          `}
        >
          Imaging Order for <strong>{maybeOctopusImagingOrderType}</strong> with
          note:
        </div>
      )}
      <div>{formattedMessage}</div>
      {payload && (
        <div
          css={css`
            display: flex;
          `}
        >
          <PayloadDisplay type={item.type} payload={payload} />
          {maybeUsages?.length > 0 && (
            <div
              css={css`
                font-size: 75%;
                margin-left: 5px;
              `}
            >
              Used for:
              <ul
                css={css`
                  margin: 0;
                  padding-inline-start: 20px;
                `}
              >
                {maybeUsages?.map((usageNode, index) => (
                  <li
                    key={index}
                    css={css`
                      cursor: pointer;
                      font-weight: bold;
                    `}
                    onClick={() =>
                      usageNode.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                      })
                    }
                  >
                    {usageNode.dataset.usageLocation || <em>somewhere</em>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
