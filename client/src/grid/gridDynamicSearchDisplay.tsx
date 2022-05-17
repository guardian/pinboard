import { DynamicGridPayload } from "../types/PayloadAndType";
import { useLazyQuery } from "@apollo/client";
import {
  GridBadgeData,
  GridSearchSummary,
} from "../../../shared/graphql/graphql";
import { gqlGetGridSearchSummary } from "../../gql";
import React, { useEffect, useState } from "react";
import { useGlobalStateContext } from "../globalState";
import { css } from "@emotion/react";
import { space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import { FormattedDateTime } from "../formattedDateTime";
import { GridBadge } from "./gridBadges";
import { SvgReload } from "@guardian/source-react-components";

type GridDynamicSearchDisplayProps = Pick<DynamicGridPayload, "payload">;

const formatChip = (chip: GridBadgeData) => {
  if (chip.text.match(/^[+-]/i)) {
    return chip;
  } else {
    return { ...chip, text: `+${chip.text}` };
  }
};

export const GridDynamicSearchDisplay = ({
  payload,
}: GridDynamicSearchDisplayProps) => {
  const [
    gridSearchSummaryLastChecked,
    setGridSearchSummaryLastChecked,
  ] = useState<number>();

  const [getGridSearchSummary, getGridSearchSummaryQuery] = useLazyQuery<{
    getGridSearchSummary: GridSearchSummary;
  }>(gqlGetGridSearchSummary, {
    onCompleted() {
      setGridSearchSummaryLastChecked(Date.now());
    },
  });

  const { isExpanded } = useGlobalStateContext();

  useEffect(() => {
    if (
      isExpanded /* TODO ideally this would also check if this is visible in viewport */
    ) {
      getGridSearchSummaryQuery.stopPolling();
      getGridSearchSummaryQuery.startPolling(300000); // every 5 mins
    } else {
      getGridSearchSummaryQuery.stopPolling();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (payload.apiUrl) {
      getGridSearchSummary({
        variables: {
          apiUrl: payload.apiUrl.replace(
            ".local.dev-gutools.co.uk",
            ".test.dev-gutools.co.uk"
          ),
        },
      }).then(() => setGridSearchSummaryLastChecked(Date.now()));
    }
  }, [payload.apiUrl]);

  const maybeGridSearchSummary =
    getGridSearchSummaryQuery?.data?.getGridSearchSummary;

  const maybeQueryBreakdown = maybeGridSearchSummary?.queryBreakdown;

  return (
    <React.Fragment>
      <div
        css={css`
          display: grid;
          grid-template-columns: 94px 94px;
          grid-auto-rows: 94px;
          gap: ${space["1"]}px;
        `}
      >
        {maybeGridSearchSummary?.thumbnails.map((thumbnail, index) => (
          <img // TODO: hover for larger thumbnail
            key={index}
            src={thumbnail}
            css={{
              objectFit: "cover", // this sizes and centers the image to the shortest side, clipping the image on the longer side
              width: "100%",
              height: "100%",
            }}
            draggable={false}
          />
        ))}
      </div>

      {!getGridSearchSummaryQuery.loading && maybeQueryBreakdown && (
        <div
          css={css`
            font-family: ${agateSans.xsmall({ fontWeight: "bold" })};
            display: flex;
            flex-wrap: wrap;
            gap: ${space["1"]}px;
            margin: ${space["1"]}px 0;
            align-items: center;
          `}
        >
          {maybeQueryBreakdown.collections?.map(GridBadge)}
          {maybeQueryBreakdown.labels?.map(GridBadge)}
          {maybeQueryBreakdown.chips?.map(formatChip).map(GridBadge)}
          {maybeQueryBreakdown.restOfSearch}
        </div>
      )}

      <span
        css={css`
          font-family: ${agateSans.xxsmall({ fontWeight: "bold" })};
          line-height: 36px;
          margin-bottom: 6px;
        `}
      >
        {getGridSearchSummaryQuery.loading && "loading..."}
      </span>

      <span
        css={css`
          font-family: ${agateSans.xxsmall({ fontWeight: "bold" })};
        `}
      >
        {!getGridSearchSummaryQuery.loading &&
          maybeGridSearchSummary &&
          `${maybeGridSearchSummary.total} images`}
      </span>

      {maybeGridSearchSummary &&
        gridSearchSummaryLastChecked &&
        !getGridSearchSummaryQuery.loading && (
          <div>
            <span
              css={css`
                font-family: ${agateSans.xxsmall()};
              `}
            >
              Last checked{" "}
              <FormattedDateTime
                timestamp={gridSearchSummaryLastChecked}
                isPartOfSentence
                withAgo
              />
            </span>
            <button
              css={css`
                position: absolute;
                bottom: ${space[1]}px;
                right: ${space[1]}px;
                border: none;
                padding: 0;
                cursor: pointer;
                background: none;

                /* https://stackoverflow.com/a/54095811 */
                transform: rotate(360deg);
                transform-origin: center 10px;
                transition: transform 0.5s;
                &:active {
                  transform: rotate(0deg);
                  transition: 0s;
                }
              `}
              onClick={(event) => {
                event.stopPropagation();
                getGridSearchSummaryQuery.refetch();
              }}
            >
              <SvgReload size="xsmall" />
            </button>
          </div>
        )}
    </React.Fragment>
  );
};
