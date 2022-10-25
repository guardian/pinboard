import React, { useState } from "react";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { SvgSpinner } from "@guardian/source-react-components";
import { Claimed, Item, MentionHandle } from "../../shared/graphql/graphql";
import { PendingItem } from "./types/PendingItem";
import { FetchResult } from "@apollo/client";
import { formatMentionHandlesInText } from "./mentionsUtil";

const formatMentionHandles = (
  mentionHandles: MentionHandle[]
): JSX.Element | string => {
  const mentions = mentionHandles.map((mentionHandle) => mentionHandle.label);
  const lastMention = mentions[mentions.length - 1];
  if (!lastMention) return "unknown";
  const otherMentions = mentions.slice(0, -1);
  return formatMentionHandlesInText(
    mentionHandles,
    otherMentions.length > 0
      ? `${otherMentions.join(", ")} and ${lastMention}`
      : lastMention
  );
};

interface ClaimableItemProps {
  item: Item | PendingItem;
  claimItem: () => Promise<FetchResult<{ claimItem: Claimed }>>;
  userDisplayName: string;
  maybeClaimedByName: string | null;
}

export const ClaimableItem = ({
  item,
  claimItem,
  userDisplayName,
  maybeClaimedByName,
}: ClaimableItemProps) => {
  const isMentionApplicableToMe = item.groupMentions?.find(({ isMe }) => isMe);

  const [isClaiming, setIsClaiming] = useState(false);
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: ${space[1]}px;
        margin: ${space[2]}px 0;
        ${agateSans.xxsmall({ lineHeight: "tight" })};
      `}
    >
      {isClaiming ? (
        <React.Fragment>
          <SvgSpinner size="xsmall" />
          claiming
        </React.Fragment>
      ) : (
        <div
          css={css`
            border: 1px solid;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: ${space[2]}px;
          `}
        >
          <div>
            {userDisplayName} has made a request to{" "}
            {formatMentionHandles(item.groupMentions || [])}
          </div>
          <div>
            <strong>
              {maybeClaimedByName
                ? `Claimed by ${maybeClaimedByName}`
                : "This request has not been claimed yet"}
            </strong>
          </div>

          {!maybeClaimedByName && isMentionApplicableToMe && (
            <div>
              <button
                css={css`
                  cursor: pointer;
                  width: 100%;
                  border-radius: 2px;
                  border: 1px solid ${palette.neutral["60"]};
                  color: ${palette.neutral["10"]};
                `}
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to claim this on behalf of the group?"
                    )
                  ) {
                    setIsClaiming(true);
                    claimItem()
                      .catch((error) => {
                        console.error(error);
                        // TODO display error to user
                      })
                      .finally(() => setIsClaiming(false));
                  }
                }}
              >
                Claim
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
