import { css, Global } from "@emotion/react";
import React, { useEffect, useRef, useState } from "react";
import { bottom, boxShadow, floatySize, panelCornerSize, top } from "./styling";
import { Pinboard } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { neutral, palette, space } from "@guardian/source-foundations";
import { Navigation } from "./navigation";
import { useGlobalStateContext } from "./globalState";
import { getTooltipText } from "./util";
import { dropTargetCss, IsDropTargetProps } from "./drop";
import { ChatTab } from "./types/Tab";
import { pinboard } from "../colours";
import { useQuery } from "@apollo/client";
import { gqlGetGroupPinboardIds, gqlGetPinboardsByIds } from "../gql";
import { PinboardIdWithClaimCounts } from "../../shared/graphql/graphql";
import {
  PinboardData,
  PinboardDataWithClaimCounts,
} from "../../shared/graphql/extraTypes";

const teamPinboardsSortFunction = (
  a: PinboardIdWithClaimCounts,
  b: PinboardIdWithClaimCounts
) => {
  const unclaimedDiff = b.unclaimedCount - a.unclaimedCount;
  if (unclaimedDiff !== 0) {
    return unclaimedDiff;
  }
  return (
    parseInt(b.latestGroupMentionItemId) - parseInt(a.latestGroupMentionItemId)
  );
};

export const Panel: React.FC<IsDropTargetProps> = ({ isDropTarget }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    isExpanded,
    activePinboards,
    activePinboardIds,
    selectedPinboardId,
    clearSelectedPinboard,
    activeTab,
    setActiveTab,
    boundedPositionTranslation,
  } = useGlobalStateContext();

  const selectedPinboard = activePinboards.find(
    (activePinboard) => activePinboard.id === selectedPinboardId
  );
  const [
    maybePeekingAtPinboard,
    setMaybePeekingAtPinboard,
  ] = useState<PinboardData | null>(null);

  const title = (() => {
    if (selectedPinboard?.isNotFound) {
      return "PINBOARD NOT FOUND";
    }
    if (selectedPinboardId) {
      return selectedPinboard?.title || "Loading pinboard...";
    }
    if (maybePeekingAtPinboard) {
      return maybePeekingAtPinboard?.title || "Loading pinboard...";
    }
    return "Select a pinboard";
  })();

  useEffect(() => {
    setActiveTab(ChatTab);
  }, [selectedPinboardId]);

  const isLeftHalf =
    Math.abs(boundedPositionTranslation.x) > window.innerWidth / 2;
  const isTopHalf =
    Math.abs(boundedPositionTranslation.y) > window.innerHeight / 2;

  const groupPinboardIdsQuery = useQuery(gqlGetGroupPinboardIds);

  const groupPinboardIdsWithClaimCounts: PinboardIdWithClaimCounts[] =
    groupPinboardIdsQuery.data?.getGroupPinboardIds || [];

  const [isShowAllTeamPinboards, setIsShowAllTeamPinboards] = useState(false);
  const unclaimedCount = groupPinboardIdsWithClaimCounts.filter(
    (_) => _.unclaimedCount > 0
  ).length;
  const noOfTeamPinboardsToShow = isShowAllTeamPinboards
    ? groupPinboardIdsWithClaimCounts.length
    : unclaimedCount > 5
    ? unclaimedCount
    : 5;
  const noOfTeamPinboardsNotShown =
    groupPinboardIdsWithClaimCounts.length - noOfTeamPinboardsToShow;

  const groupPinboardIds = [...groupPinboardIdsWithClaimCounts]
    .sort(teamPinboardsSortFunction)
    .slice(0, noOfTeamPinboardsToShow)
    .map((_) => _.pinboardId);

  const pinboardDataQuery = useQuery<{
    getPinboardsByIds: PinboardData[];
  }>(gqlGetPinboardsByIds, {
    variables: {
      ids: groupPinboardIds,
    },
  });

  useEffect(() => {
    pinboardDataQuery.refetch();
  }, [...groupPinboardIds]);

  const pinboardsWithClaimCounts =
    pinboardDataQuery.data?.getPinboardsByIds
      ?.reduce((acc, pinboardData) => {
        const maybePinboardIdWithClaimCounts = groupPinboardIdsWithClaimCounts.find(
          (_) => _.pinboardId === pinboardData.id
        );
        return maybePinboardIdWithClaimCounts
          ? [
              ...acc,
              {
                ...pinboardData,
                ...maybePinboardIdWithClaimCounts,
              },
            ]
          : acc;
      }, [] as PinboardDataWithClaimCounts[])
      .sort(teamPinboardsSortFunction) || [];

  useEffect(() => {
    if (isExpanded) {
      groupPinboardIdsQuery.refetch();
      pinboardDataQuery.refetch();
      groupPinboardIdsQuery.startPolling(5000);
      pinboardDataQuery.startPolling(5000);
    } else {
      groupPinboardIdsQuery.stopPolling();
      pinboardDataQuery.stopPolling();
    }
  }, [
    isExpanded,
    ...groupPinboardIds, // spread required because useEffect only checks the pointer, not the contents of the activePinboardIds array
  ]);

  const peekAtPinboard = (pinboard: PinboardData) =>
    setMaybePeekingAtPinboard(pinboard);

  return (
    <div
      css={css`
        position: fixed;
        z-index: 99998;
        background: ${neutral[93]};
        box-shadow: ${boxShadow};
        width: 260px;
        transform: translateX(${isLeftHalf ? "100%" : 0});
        top: ${
          isTopHalf
            ? `calc(100vh + ${
                space[2] + panelCornerSize + boundedPositionTranslation.y
              }px)`
            : `${top}px`
        };
        bottom: ${
          isTopHalf
            ? bottom
            : Math.abs(boundedPositionTranslation.y) +
              floatySize +
              space[2] +
              panelCornerSize
        }px;
        right: ${Math.abs(boundedPositionTranslation.x) + floatySize / 2}px;
        display: ${isExpanded ? "flex" : "none"};
        flex-direction: column;
        font-family: sans-serif;
        border-radius: 4px;
        border-${isTopHalf ? "top" : "bottom"}-${
        isLeftHalf ? "left" : "right"
      }-radius: 0;
      `}
      ref={panelRef}
    >
      <div
        css={css`
          position: absolute;
          background: ${isTopHalf ? pinboard["500"] : neutral[93]};
          width: ${panelCornerSize}px;
          height: ${panelCornerSize}px;
          ${isTopHalf ? "top" : "bottom"}: -${panelCornerSize - 1}px;
          ${isLeftHalf ? "left" : "right"}: 0;
          right: 0;
          border-${isTopHalf ? "top" : "bottom"}-${
          isLeftHalf ? "right" : "left"
        }-radius: ${panelCornerSize}px;
          box-shadow: ${boxShadow};
          clip: rect(${
            isTopHalf ? -5 : 0
          }px, 50px, 50px, -25px); // clip off the top of the shadow FIXME make relative
      `}
      />
      {isDropTarget && <div css={{ ...dropTargetCss }} />}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPinboard={selectedPinboard || maybePeekingAtPinboard}
        clearSelectedPinboard={() => {
          clearSelectedPinboard();
          setMaybePeekingAtPinboard(null);
        }}
        headingTooltipText={
          (selectedPinboard && getTooltipText(selectedPinboard)) ||
          (maybePeekingAtPinboard
            ? getTooltipText(maybePeekingAtPinboard)
            : undefined)
        }
        isTopHalf={isTopHalf}
        isLeftHalf={isLeftHalf}
      >
        <span
          css={{
            textDecoration: (selectedPinboard || maybePeekingAtPinboard)
              ?.trashed
              ? "line-through"
              : undefined,
            fontStyle: (selectedPinboard || maybePeekingAtPinboard)?.isNotFound
              ? "italic"
              : undefined,
          }}
        >
          {title}
        </span>
      </Navigation>

      {!selectedPinboardId && !maybePeekingAtPinboard && (
        <SelectPinboard
          pinboardsWithClaimCounts={pinboardsWithClaimCounts}
          peekAtPinboard={peekAtPinboard}
          noOfTeamPinboardsNotShown={noOfTeamPinboardsNotShown}
          isShowAllTeamPinboards={isShowAllTeamPinboards}
          setIsShowAllTeamPinboards={setIsShowAllTeamPinboards}
        />
      )}

      <Global
        styles={{
          "@keyframes highlight-item": {
            "0%": {
              background: "initial",
            },
            "50%": {
              background: palette.neutral[86],
            },
            "100%": {
              background: "initial",
            },
          },
        }}
      />

      {
        // The active pinboards are always mounted, so that we receive new item notifications
        // Note that the pinboard hides itself based on 'isSelected' prop
        activePinboardIds.map((pinboardId) => (
          <Pinboard
            key={pinboardId}
            pinboardId={pinboardId}
            isExpanded={pinboardId === selectedPinboardId && isExpanded}
            isSelected={pinboardId === selectedPinboardId}
            panelElement={panelRef.current}
          />
        ))
      }

      {maybePeekingAtPinboard && (
        <Pinboard
          pinboardId={maybePeekingAtPinboard.id}
          isExpanded={isExpanded}
          isSelected={true}
          panelElement={panelRef.current}
        />
      )}
    </div>
  );
};
