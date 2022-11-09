import React, { useState } from "react";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { SvgSpinner } from "@guardian/source-react-components";
import { Claimed, Item, MentionHandle } from "../../shared/graphql/graphql";
import { PendingItem } from "./types/PendingItem";
import { FetchResult } from "@apollo/client";
import { formatMentionHandlesInText } from "./mentionsUtil";
import { composer } from "../colours";
import Tick from "../../client/icons/tick.svg";
import Pencil from "../../client/icons/pencil.svg";
import { ConfirmableButton } from "./confirmableButton";

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
        gap: ${space[1]}px;
        ${agateSans.xxsmall({ lineHeight: "tight" })};
        margin-top: ${space[1]}px;
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
            padding: ${space[2]}px;
            display: flex;
            flex-direction: column;
            border-radius: ${space[1]}px;
            font-weight: bold;
            border: 1px solid #dcdcdc;
          `}
        >
          <div
            css={css`
              margin-top: ${space[1]};
              display: flex;
              color: ${palette.neutral[maybeClaimedByName ? 46 : 20]};
              svg {
                path {
                  fill: ${palette.neutral[maybeClaimedByName ? 46 : 20]};
                }
              }
            `}
          >
            <Pencil />
            &nbsp;
            <div>
              {userDisplayName} made a request to{" "}
              {formatMentionHandles(item.groupMentions || [])}
              <div
                css={css`
                  display: flex;
                  flex-direction: column;
                  gap: ${space[1]}px;
                  margin-top: ${space[1]}px;
                `}
              >
                <div>
                  {maybeClaimedByName ? (
                    <strong
                      css={css`
                        padding: ${space[1]}px;
                        border: 1px solid ${composer.primary[300]};
                        border-radius: ${space[1]}px;
                        width: auto;
                        color: ${composer.primary[300]};
                        svg {
                          path {
                            fill: ${composer.primary[300]};
                          }
                        }
                      `}
                    >
                      Claimed by {maybeClaimedByName} &nbsp;
                      <Tick />
                    </strong>
                  ) : (
                    <span
                      css={css`
                        color: ${palette.neutral[20]};
                        font-weight: 400;
                      `}
                    >
                      This request has not been picked up by anyone yet
                    </span>
                  )}
                </div>

                {!maybeClaimedByName && isMentionApplicableToMe && (
                  <div>
                    <ConfirmableButton
                      label={"Claim"}
                      backgroundColor={composer.primary[300]}
                      onClick={() => {
                        setIsClaiming(true);
                        claimItem()
                          .catch((error) => {
                            console.error(error); // TODO display error to user
                          })
                          .finally(() => setIsClaiming(false));
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
