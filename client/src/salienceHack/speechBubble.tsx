import React from "react";
import { Item } from "shared/graphql/graphql";
import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import { useGlobalStateContext } from "../globalState";
import { boxShadow } from "../styling";
import { agateSans } from "../../fontNormaliser";
import { AvatarRoundel } from "../avatarRoundel";

interface SpeechBubbleProps {
  item: Item;
}
export const SpeechBubble = ({ item }: SpeechBubbleProps) => {
  const { userLookup } = useGlobalStateContext();
  const user = userLookup[item.userEmail];
  return (
    <div
      css={css`
        background: ${palette.neutral["93"]};
        box-shadow: ${boxShadow};
        padding: ${space[2]}px;
        max-width: 250px;
        display: flex;
        ${agateSans.xsmall()};
        border-radius: ${space[1]}px;
        align-items: center;
        gap: ${space[2]}px;
        // TODO add animation, slide/fade in plus bounce
      `}
    >
      <AvatarRoundel
        maybeUserOrGroup={user}
        size={50}
        fallback={item.userEmail}
      />
      <div
        css={css`
          text-overflow: ellipsis;
          width: max-content;
          overflow: hidden;
          line-clamp: 2;
        `}
      >
        <strong>{user.firstName}</strong>
        <br />
        {item.message || <em>Click here...</em>}
      </div>
    </div>
  );
};
