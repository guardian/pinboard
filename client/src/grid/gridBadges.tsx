import React from "react";
import { css } from "@emotion/react";
import { GridBadgeData } from "../../../shared/graphql/graphql";
import { palette, space } from "@guardian/source-foundations";

type GridBadgeProps = GridBadgeData;

export const GridBadge = ({ text, color }: GridBadgeProps) => (
  <div
    css={css`
      color: ${palette.neutral["100"]};
      background-color: ${color};
      padding: 1px ${space["1"]}px;
      border-radius: ${space["1"]}px;
    `}
  >
    {text}
  </div>
);
