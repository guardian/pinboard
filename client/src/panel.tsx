import { css, Global } from "@emotion/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  bottom,
  boxShadow,
  floatySize,
  highlightItemsKeyFramesCSS,
  panelCornerSize,
  top,
} from "./styling";
import { Pinboard } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { neutral, space } from "@guardian/source-foundations";
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
import { ErrorOverlay } from "./errorOverlay";
import { Tour } from "./tour/tour";
import { useTourProgress } from "./tour/tourState";
import { demoPinboardsWithClaimCounts } from "./tour/tourConstants";

const teamPinboardsSortFunction = (
  a: PinboardIdWithClaimCounts,
  b: PinboardIdWithClaimCounts
) => {
  const unclaimedDiff = b.unclaimedCount - a.unclaimedCount;
  if (a.hasUnread !== b.hasUnread) {
    return a.hasUnread ? -1 : 1;
  }
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
    hasError,
    isExpanded,
    activePinboards,
    activePinboardIds,
    selectedPinboardId,
    clearSelectedPinboard,
    activeTab,
    setActiveTab,
    boundedPositionTranslation,
    setUnreadFlag,
  } = useGlobalStateContext();

  const tourProgress = useTourProgress();

  const selectedPinboard = activePinboards.find(
    (activePinboard) => activePinboard.id === selectedPinboardId
  );
  const [_maybePeekingAtPinboard, setMaybePeekingAtPinboard] =
    useState<PinboardData | null>(null);
  const maybePeekingAtPinboard = tourProgress.isRunning
    ? null
    : _maybePeekingAtPinboard;

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

  const groupPinboardIdsQuery = useQuery(gqlGetGroupPinboardIds, {
    pollInterval: 5000, // always poll this one, to ensure we get unread flags even when pinboard is not expanded
  });

  const groupPinboardIdsWithClaimCounts: PinboardIdWithClaimCounts[] = useMemo(
    () =>
      [...(groupPinboardIdsQuery.data?.getGroupPinboardIds || [])].sort(
        teamPinboardsSortFunction
      ),
    [groupPinboardIdsQuery.data]
  );

  useEffect(() => {
    groupPinboardIdsWithClaimCounts.forEach(({ pinboardId, hasUnread }) =>
      setUnreadFlag(pinboardId)(hasUnread)
    );
  }, [groupPinboardIdsWithClaimCounts]);

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

  const groupPinboardIds = groupPinboardIdsWithClaimCounts
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

  const pinboardsWithClaimCounts = tourProgress.isRunning
    ? demoPinboardsWithClaimCounts
    : pinboardDataQuery.data?.getPinboardsByIds
        ?.reduce((acc, pinboardData) => {
          const maybePinboardIdWithClaimCounts =
            groupPinboardIdsWithClaimCounts.find(
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
      pinboardDataQuery.refetch();
      pinboardDataQuery.startPolling(5000);
    } else {
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
      {hasError && <ErrorOverlay />}
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
          (selectedPinboard &&
            getTooltipText(
              selectedPinboard.title,
              selectedPinboard.headline
            )) ||
          (maybePeekingAtPinboard
            ? getTooltipText(
                maybePeekingAtPinboard.title,
                maybePeekingAtPinboard.headline
              )
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
      {panelRef.current && <Tour panelElement={panelRef.current} />}

      {!selectedPinboardId && !maybePeekingAtPinboard && (
        <SelectPinboard
          pinboardsWithClaimCounts={pinboardsWithClaimCounts}
          peekAtPinboard={peekAtPinboard}
          noOfTeamPinboardsNotShown={noOfTeamPinboardsNotShown}
          isShowAllTeamPinboards={isShowAllTeamPinboards}
          setIsShowAllTeamPinboards={setIsShowAllTeamPinboards}
        />
      )}

      <Global styles={highlightItemsKeyFramesCSS} />

      {
        // The active pinboards are always mounted, so that we receive new item notifications
        // Note that the pinboard hides itself based on 'isSelected' prop
        activePinboardIds.map((pinboardId) => (
          <Pinboard
            key={pinboardId}
            pinboardId={pinboardId}
            composerId={useMemo(
              () =>
                activePinboards.find((_) => _.id === pinboardId)?.composerId ||
                null,
              [activePinboards, pinboardId]
            )}
            isExpanded={pinboardId === selectedPinboardId && isExpanded}
            isSelected={pinboardId === selectedPinboardId}
            panelElement={panelRef.current}
          />
        ))
      }

      {maybePeekingAtPinboard && (
        <Pinboard
          pinboardId={maybePeekingAtPinboard.id}
          composerId={maybePeekingAtPinboard.composerId}
          isExpanded={isExpanded}
          isSelected={true}
          panelElement={panelRef.current}
        />
      )}
    </div>
  );
};
