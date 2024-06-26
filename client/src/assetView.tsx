import { css } from "@emotion/react";
import { palette, space } from "@guardian/source-foundations";
import React from "react";
import { scrollbarsCss } from "./styling";
import type { Item } from "../../shared/graphql/graphql";
import { PayloadDisplay } from "./payloadDisplay";
import { buildPayloadAndType, PayloadAndType } from "./types/PayloadAndType";
import * as Sentry from "@sentry/react";

interface AssetViewProps {
  items: Item[];
}

export const AssetView = ({ items }: AssetViewProps) => {
  const payloadsMap: PayloadAndType[] = items
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .reduce<PayloadAndType[]>((accumulator, item) => {
      if (!item.payload) {
        return accumulator;
      }

      const payload = JSON.parse(item.payload);
      const payloadAndType = buildPayloadAndType(item.type, payload);
      if (!payloadAndType) {
        Sentry.captureException(
          new Error(
            `Failed to parse payload with type=${item.type}, payload=${item.payload}`
          )
        );
        return accumulator;
      }

      return payload.embeddableUrl &&
        !accumulator.some(
          (other) =>
            other.payload.embeddableUrl === payloadAndType.payload.embeddableUrl
        )
        ? [...accumulator, payloadAndType]
        : accumulator;
    }, []);

  return (
    <div
      css={css`
        overflow-y: auto;
        ${scrollbarsCss(palette.neutral[60])}
        padding: ${space[2]}px;
        position: relative;
      `}
    >
      {payloadsMap.map((payloadAndType) => (
        <PayloadDisplay
          key={payloadAndType.payload.embeddableUrl}
          payloadAndType={payloadAndType}
          tab="asset"
        />
      ))}
    </div>
  );
};
