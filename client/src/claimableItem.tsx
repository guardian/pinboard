import React, { useState } from "react";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { SvgSpinner } from "@guardian/source-react-components";
import { UserLookup } from "./types/UserLookup";
import { Claimed, Item } from "../../shared/graphql/graphql";
import { PendingItem } from "./types/PendingItem";
import { FetchResult } from "@apollo/client";

interface ClaimableItemProps {
  item: Item | PendingItem;
  userLookup: UserLookup;
  maybeClaimedItem: Item | false | undefined;
  userEmail: string;
  claimItem: () => Promise<FetchResult<{ claimItem: Claimed }>>;
}

const getUserDisplayName = (userLookup: UserLookup, userId: string) => {
  return userLookup[userId]
    ? `${userLookup[userId].firstName} ${userLookup[userId].lastName}`
    : userId; // TODO - We can format this better later
};

const getGroupMentionLabel = (item: Item | PendingItem): string =>
  item.groupMentions?.[0]?.label || "unknown"; // FIXME - there could be loads in here - how do we determine which one to show? (Perhaps all?)

export const ClaimableItem = ({
  item,
  claimItem,
  userLookup,
  maybeClaimedItem, // TODO - think about whether we should be showing this at all
  userEmail,
}: ClaimableItemProps) => {
  const maybeClaimedBy = item.claimedByEmail && userLookup[item.claimedByEmail];

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
            display: flex;
            width: 100%;
          `}
        >
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              width: 100%;
              justify-content: center;
              border: 1px solid;
            `}
          >
            <div
              css={css`
                display: flex;
                width: 100%;
                padding: 5px 2px 0;
                justify-content: center;
              `}
            >{`${getUserDisplayName(
              userLookup,
              item.userEmail
            )} has made a request to ${getGroupMentionLabel(item)}`}</div>
            <div
              css={css`
                display: flex;
                padding: 8px 8px;
                width: 100%;
              `}
            >
              {" "}
              <strong>
                {maybeClaimedBy
                  ? `Claimed by ${
                      userEmail === maybeClaimedBy.email
                        ? "you"
                        : `${maybeClaimedBy.firstName} ${maybeClaimedBy.lastName}`
                    }`
                  : "This request has not been claimed yet"}
              </strong>
            </div>

            {!maybeClaimedBy && isMentionApplicableToMe && (
              <div
                css={css`
                  display: flex;
                  padding: 5px;
                  width: 100%;
                `}
              >
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
        </div>
      )}
    </div>
  );
};
