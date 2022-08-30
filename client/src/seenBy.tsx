import { css } from "@emotion/react";
import { palette } from "@guardian/source-foundations";
import { SvgPlus } from "@guardian/source-react-components";
import React, { useContext } from "react";
import { LastItemSeenByUser, User } from "../../shared/graphql/graphql";
import { agateSans } from "../fontNormaliser";
import { AvatarRoundel } from "./avatarRoundel";
import { TickContext } from "./formattedDateTime";
import { formatDateTime } from "./util";

const maxSeenByIcons = 2;
const roundelHeightPx = 15;
const roundelOverlapPct = 25;

interface SeenByProps {
  seenBy: LastItemSeenByUser[];
  userLookup: { [email: string]: User } | undefined;
}

export const SeenBy = ({ seenBy, userLookup }: SeenByProps) => {
  useContext(TickContext); // this should cause re-render

  const tooltip = seenBy
    .map(({ seenAt, userEmail }) => {
      const user = userLookup?.[userEmail];
      const name = user ? `${user.firstName} ${user.lastName}` : userEmail;

      return `${name} (${formatDateTime(new Date(seenAt).valueOf())})`;
    })
    .join("\n");

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        justify-content: flex-end;
      `}
      title={tooltip}
    >
      <span
        css={css`
          color: ${palette.neutral[20]};
          margin-right: 5px;
          ${agateSans.xxsmall({ lineHeight: "tight" })}
        `}
      >
        Seen by
      </span>
      {seenBy.slice(0, maxSeenByIcons).map(({ userEmail }, i) => (
        <div
          key={userEmail}
          css={css`
            transform: translateX(-${i * roundelOverlapPct}%);
            z-index: ${99999 - i};
            height: ${roundelHeightPx}px;
          `}
        >
          <AvatarRoundel
            maybeUser={userLookup?.[userEmail]}
            size={roundelHeightPx}
            userEmail={userEmail}
            shouldHideTooltip
          />
        </div>
      ))}
      {seenBy.length > maxSeenByIcons && (
        <div
          css={css`
            transform: translateX(-${maxSeenByIcons * roundelOverlapPct}%);
          `}
        >
          <span
            css={css`
              & > svg {
                height: ${roundelHeightPx}px;
                display: flex;
                align-items: center;
              }
            `}
          >
            <SvgPlus size="xsmall" />
          </span>
        </div>
      )}
    </div>
  );
};
