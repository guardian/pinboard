import { css } from "@emotion/react";
import { neutral, palette, space } from "@guardian/source-foundations";
import React from "react";
import { scrollbarsCss } from "./styling";
import type { Item } from "../../shared/graphql/graphql";
import type { PendingItem } from "./types/PendingItem";
import { PayloadDisplay } from "./payloadDisplay";
import type { Payload, PayloadAndType } from "./types/PayloadAndType";

interface AssetView {
  initialItems: (Item | PendingItem)[];
  successfulSends: PendingItem[];
  subscriptionItems: Item[];
}

export const AssetView: React.FC<AssetView> = ({
  initialItems,
  successfulSends,
  subscriptionItems,
}) => {
  const payloadsMap: PayloadAndType[] = [
    ...initialItems,
    ...successfulSends,
    ...subscriptionItems,
  ]
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((accumulator, item) => {
      if (!item.payload) {
        return accumulator;
      }
      const payload = JSON.parse(item.payload) as Payload;
      const payloadAndType = { type: item.type, payload };
      return payload.embeddableUrl &&
        payload.thumbnail &&
        !accumulator.some(
          (other) =>
            other.payload.embeddableUrl === payloadAndType.payload.embeddableUrl
        )
        ? [...accumulator, payloadAndType]
        : accumulator;
    }, [] as PayloadAndType[]);

  return (
    <div
      css={css`
        overflow-y: auto;
        ${scrollbarsCss(palette.neutral[60])}
        padding: ${space[2]}px;
        position: relative;
      `}
    >
      {payloadsMap.map(({ type, payload }) => (
        <div
          key={payload.thumbnail}
          css={css`
            margin: ${space[1]}px;
            border: 1px solid ${neutral[86]};
            border-radius: ${space[1]}px;
            max-width: fit-content;
            &:hover {
              background-color: ${neutral[86]};
            }
          `}
        >
          <PayloadDisplay type={type} payload={payload} />
        </div>
      ))}
    </div>
  );
};
