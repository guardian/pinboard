import React, { useEffect, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { css, CSSObject } from "@emotion/react";
import { standardPanelContainerCss } from "./styling";
import { PayloadDisplay } from "./payloadDisplay";
import { composer, pinboard } from "../colours";
import { palette, space } from "@guardian/source-foundations";
import { gqlListPinboards } from "../gql";
import { PushNotificationPreferencesOpener } from "./pushNotificationPreferences";
import { useGlobalStateContext } from "./globalState";
import { MAX_PINBOARDS_TO_DISPLAY } from "../../shared/constants";
import {
  isPinboardData,
  isPinboardDataWithClaimCounts,
  PinboardData,
  PinboardDataWithClaimCounts,
} from "../../shared/graphql/extraTypes";
import { getTooltipText } from "./util";
import { agateSans } from "../fontNormaliser";
import {
  SvgAlertTriangle,
  SvgChevronRightSingle,
  SvgCross,
  SvgExternal,
  SvgMagnifyingGlass,
  SvgSpinner,
  TextInput,
} from "@guardian/source-react-components";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { Feedback } from "./feedback";
import { useTourProgress, useTourStepRef } from "./tour/tourState";
import { demoPinboardData } from "./tour/tourConstants";
import { ComposerIcon } from "./navigation/icon";
import {
  getWorkflowTitleElementLookup,
  isInlineMode,
  isPinboardColumnTurnedOn,
} from "./inline/inlineMode";
import { WorkflowColumnInstructions } from "./inline/workflowColumnInstructions";

const textMarginCss: CSSObject = {
  margin: `${space["1"]}px ${space["2"]}px`,
};

const Text: React.FC = ({ children }) => (
  <div css={textMarginCss}>{children}</div>
);

const SectionHeading: React.FC = ({ children }) => (
  <div css={{ ...textMarginCss, color: palette.neutral["46"] }}>{children}</div>
);

interface SelectPinboardProps {
  pinboardsWithClaimCounts: PinboardDataWithClaimCounts[];
  noOfTeamPinboardsNotShown: number;
  isShowAllTeamPinboards: boolean;
  setIsShowAllTeamPinboards: (newValue: boolean) => void;
  workflowPinboardElements: HTMLElement[];
  setMaybeInlineSelectedPinboardId: (pinboardId: string | null) => void;
}

export const SelectPinboard = ({
  pinboardsWithClaimCounts,
  noOfTeamPinboardsNotShown,
  isShowAllTeamPinboards,
  setIsShowAllTeamPinboards,
  workflowPinboardElements,
  setMaybeInlineSelectedPinboardId,
}: SelectPinboardProps) => {
  const {
    isLoadingActivePinboardList,
    activePinboards,
    activePinboardIds,
    payloadToBeSent,
    clearPayloadToBeSent,

    isExpanded,

    openPinboard,
    openPinboardInNewTab,
    closePinboard,
    peekAtPinboard,
    preselectedPinboard,

    hasWebPushSubscription,

    errors,

    unreadFlags,
  } = useGlobalStateContext();

  const isInline = useMemo(isInlineMode, []);
  const hasPinboardColumn = useMemo(isPinboardColumnTurnedOn, []);
  const workflowTitleElementLookup = useMemo(
    () => getWorkflowTitleElementLookup(workflowPinboardElements),
    [workflowPinboardElements]
  );

  const [searchText, setSearchText] = useState<string>("");

  const [isShiftKeyDown, setIsShiftKeyDown] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) =>
      e.key === "Shift" && setIsShiftKeyDown(true);
    const handleKeyUp = (e: KeyboardEvent) =>
      e.key === "Shift" && setIsShiftKeyDown(false);
    const handleWindowBlur = () => setIsShiftKeyDown(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const activePinboardsWithoutPreselected = isPinboardData(preselectedPinboard)
    ? activePinboards.filter((_) => _.id !== preselectedPinboard.id)
    : activePinboards;

  const [searchPinboards, { data, loading, stopPolling, startPolling }] =
    useLazyQuery<{
      listPinboards: PinboardData[];
    }>(gqlListPinboards, {
      context: { debounceKey: gqlListPinboards, debounceTimeout: 500 },
    });

  useEffect(() => {
    if (isExpanded && searchText) {
      stopPolling();
      searchPinboards({
        variables: {
          searchText,
        },
      });
      startPolling(5000);
    } else {
      stopPolling();
    }
  }, [isExpanded, searchText]);

  const searchResultsUnreadFirst = searchText
    ? [...(data?.listPinboards || [])].sort(
        (a, b) => (unreadFlags[a.id] ? -1 : unreadFlags[b.id] ? 1 : 0) // pinboards with unread to the top
      )
    : [];

  const unopenedPinboards = searchResultsUnreadFirst.filter(
    (pinboardData: PinboardData) => !activePinboardIds.includes(pinboardData.id)
  );

  const markWithSearchText = (input: string, isRecursed = false) => {
    if (!searchText) return;
    const startIndex = input.toLowerCase().indexOf(searchText.toLowerCase());
    if (startIndex === -1) return isRecursed ? input : undefined;
    const endIndex = startIndex + searchText.length;
    return (
      <React.Fragment>
        {input.substring(0, startIndex)}
        <mark>{input.substring(startIndex, endIndex)}</mark>
        {markWithSearchText(input.substring(endIndex), true)}
      </React.Fragment>
    );
  };

  const OpenPinboardButton = (
    pinboardData: PinboardData | PinboardDataWithClaimCounts
  ) => {
    const highlightedWorkingTitle =
      pinboardData.title && markWithSearchText(pinboardData.title);
    const highlightedHeadline =
      pinboardData.headline && markWithSearchText(pinboardData.headline);

    const isActivePinboard = activePinboardIds.includes(pinboardData.id);

    const isThePreselectedPinboard =
      isPinboardData(preselectedPinboard) &&
      pinboardData.id === preselectedPinboard.id;

    const maybePinboardWorkflowElement =
      isInline && workflowTitleElementLookup[pinboardData.id];

    const isOpenInNewTab =
      (isInline && !maybePinboardWorkflowElement) ||
      isShiftKeyDown ||
      preselectedPinboard === "notTrackedInWorkflow" ||
      (isPinboardData(preselectedPinboard) &&
        pinboardData.id !== preselectedPinboard.id);

    const isTeamPinboard = isPinboardDataWithClaimCounts(pinboardData);

    const onClick = () => {
      if (isInline && maybePinboardWorkflowElement) {
        maybePinboardWorkflowElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setMaybeInlineSelectedPinboardId(pinboardData.id);
      } else if (isOpenInNewTab || isInline) {
        openPinboardInNewTab(pinboardData);
      } else if (isTeamPinboard) {
        peekAtPinboard(pinboardData.id);
      } else {
        openPinboard(tourProgress.isRunning)(pinboardData, isOpenInNewTab);
      }
    };

    const secondaryInformation = isTeamPinboard && (
      <div>
        {!!pinboardData.unclaimedCount && (
          <React.Fragment>
            <span
              css={css`
                font-weight: bold;
                color: ${composer.primary["300"]};
              `}
            >
              {pinboardData.unclaimedCount} unclaimed item
              {pinboardData.unclaimedCount === 1 ? "" : "s"}
            </span>
            {(!!pinboardData.yourClaimedCount ||
              !!pinboardData.othersClaimedCount) &&
              ", "}
          </React.Fragment>
        )}
        {!!pinboardData.yourClaimedCount && (
          <React.Fragment>
            <span>
              {pinboardData.yourClaimedCount} item
              {pinboardData.yourClaimedCount === 1 ? "" : "s"} claimed by you
            </span>
            {!!pinboardData.othersClaimedCount && ", "}
          </React.Fragment>
        )}
        {!!pinboardData.othersClaimedCount && (
          <span>
            {pinboardData.othersClaimedCount} item
            {pinboardData.othersClaimedCount === 1 ? "" : "s"} claimed by others
          </span>
        )}
      </div>
    );

    return (
      <div
        key={pinboardData.id}
        css={{
          display: "flex",
          alignItems: "center",
          marginBottom: "2px",
        }}
      >
        <button
          css={{
            textAlign: "left",
            backgroundColor: palette.neutral["100"],
            color: palette.neutral["20"],
            fontFamily: agateSans.xxsmall(), //FIXME: typography adds the font-family. so not sure these work with object styles
            display: "flex",
            alignItems: "center",
            border: `1px solid ${palette.neutral["93"]}`,
            borderRadius: `${space[1]}px`,
            padding: `${space[1]}px 0 ${space[1]}px ${space[2]}px`,
            marginRight: `${space[1]}px`,
            minHeight: "32px",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: palette.neutral["86"],
            },
            flexGrow: 1,
            width: 0, // this value is actually ignored, but is need to stop the flexGrow from bursting the container - weird
          }}
          onClick={onClick}
          title={getTooltipText(pinboardData.title, pinboardData.headline)}
        >
          <div
            css={{
              flexGrow: 1,
              width: 0, // this value is actually ignored, but is need to stop the flexGrow from bursting the container - weird
            }}
          >
            <div
              css={{
                flexGrow: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: "bold",
              }}
            >
              <span
                css={{
                  color: palette.neutral["46"],
                  display: "inline-block",
                  width: "20px",
                }}
              >
                {!isActivePinboard && highlightedHeadline ? "HL:" : "WT:"}
              </span>{" "}
              <span
                css={{
                  textDecoration: pinboardData?.trashed
                    ? "line-through"
                    : undefined,
                  fontStyle: pinboardData?.isNotFound ? "italic" : undefined,
                }}
              >
                {isActivePinboard
                  ? pinboardData.title || "NOT FOUND"
                  : highlightedHeadline ||
                    highlightedWorkingTitle ||
                    pinboardData.title ||
                    "NOT FOUND"}
              </span>
            </div>
            {secondaryInformation && <div>{secondaryInformation}</div>}
          </div>
          {isActivePinboard && errors[pinboardData.id] && (
            <div
              css={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <SvgAlertTriangle size="xsmall" css={{ height: "12px" }} />
            </div>
          )}
          {unreadFlags[pinboardData.id] && (
            <div
              css={{
                height: "10px",
                width: "10px",
                borderRadius: "5px",
                backgroundColor: palette.neutral["20"],
                marginRight: "2px",
              }}
            >
              {/* PLACEHOLDER for unread count per pinboard, once implemented*/}
            </div>
          )}
          {isShiftKeyDown && <ComposerIcon />}
          <div
            css={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {isOpenInNewTab ? (
              <React.Fragment>
                <SvgExternal size="xsmall" css={{ height: "12px" }} />
                <div css={{ width: `${space[1]}px` }} />
              </React.Fragment>
            ) : (
              <SvgChevronRightSingle size="xsmall" css={{ height: "12px" }} />
            )}
          </div>
        </button>
        {((activePinboardIds.includes(pinboardData.id) &&
          !isThePreselectedPinboard &&
          !isTeamPinboard) ||
          pinboardData.id === "DEMO") && (
          <button
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              cursor: "pointer",
              padding: 0,
              border: "none",
              height: "24px",
              width: "24px",
              borderRadius: "50%",
              "&:hover": {
                backgroundColor: palette.neutral["86"],
              },
            }}
            onClick={() => closePinboard(pinboardData.id)}
          >
            <SvgCross size="xsmall" />
          </button>
        )}
      </div>
    );
  };

  const tourProgress = useTourProgress();

  return (
    <>
      <div
        css={{
          ...standardPanelContainerCss,
          overflowY: "auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          fontFamily: agateSans.xxsmall({ fontWeight: "bold" }),
          color: palette.neutral["20"],
          mark: {
            backgroundColor: pinboard["500"],
            color: palette.neutral["20"],
          },
          outline: "none",
        }}
      >
        <Feedback
          setMaybeInlineSelectedPinboardId={setMaybeInlineSelectedPinboardId}
        />
        {isInline && !hasPinboardColumn && <WorkflowColumnInstructions />}
        {(preselectedPinboard === "notTrackedInWorkflow" ||
          preselectedPinboard === "unknown") && <NotTrackedInWorkflow />}
        {payloadToBeSent && (
          <div
            css={css`
              background-color: ${composer.primary["300"]};
              padding: ${space[1]}px ${space[2]}px;
              margin: ${space[1]}px;
              border-radius: ${space[1]}px;
              color: ${palette.neutral["100"]};
              ${agateSans.small({ fontWeight: "bold" })};
            `}
          >
            <div>Choose the pinboard for this asset</div>

            <PayloadDisplay
              payloadAndType={payloadToBeSent}
              clearPayloadToBeSent={clearPayloadToBeSent}
            />
          </div>
        )}
        {isPinboardData(preselectedPinboard) && (
          <React.Fragment>
            <SectionHeading>PINBOARD ASSOCIATED WITH THIS PIECE</SectionHeading>
            <OpenPinboardButton {...preselectedPinboard} />
            <div css={{ height: space[2] }} />
          </React.Fragment>
        )}
        <div ref={useTourStepRef("myPinboards")}>
          {(activePinboardsWithoutPreselected?.length > 0 ||
            isLoadingActivePinboardList ||
            tourProgress.isRunning) && (
            <React.Fragment>
              <SectionHeading>
                <span>MY PINBOARDS</span>
              </SectionHeading>
              {(tourProgress.isRunning
                ? [demoPinboardData]
                : activePinboardsWithoutPreselected
              ).map(OpenPinboardButton)}
              {isLoadingActivePinboardList && <SvgSpinner size="xsmall" />}
              <div css={{ height: space[2] }} />
            </React.Fragment>
          )}
        </div>
        <div ref={useTourStepRef("teamPinboards")}>
          {pinboardsWithClaimCounts?.length > 0 && (
            <React.Fragment>
              <SectionHeading>MY TEAMS&apos; PINBOARDS</SectionHeading>
              {pinboardsWithClaimCounts.map(OpenPinboardButton)}
              {!tourProgress.isRunning &&
                (noOfTeamPinboardsNotShown > 0 || isShowAllTeamPinboards) && (
                  <button
                    css={css`
                      color: ${palette.neutral["20"]};
                      border: 1px solid ${palette.neutral["93"]};
                      cursor: pointer;
                      ${agateSans.xxsmall({ fontWeight: "bold" })};
                      background-color: ${palette.neutral["100"]};
                      &:hover {
                        background-color: ${palette.neutral["86"]};
                      }
                    `}
                    onClick={() =>
                      setIsShowAllTeamPinboards(!isShowAllTeamPinboards)
                    }
                  >
                    {isShowAllTeamPinboards
                      ? "Show fewer"
                      : `Show ${noOfTeamPinboardsNotShown} more`}
                  </button>
                )}
              <div css={{ height: space[2] }} />
            </React.Fragment>
          )}
        </div>
        <div ref={useTourStepRef("searchbar")}>
          <SectionHeading>SEARCH</SectionHeading>
          <div css={{ position: "relative" }}>
            <TextInput
              label="Search"
              hideLabel
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyPress={(event) => event.stopPropagation()}
              placeholder="Search by Working Title / Headline"
              css={{
                marginBottom: "5px",
                boxSizing: "border-box",
                width: "100%",
                borderRadius: "16px",
                borderWidth: "1px",
                height: "32px",
                fontFamily: agateSans.small(),
                lineHeight: "32px",
                paddingRight: "30px", // to allow for icon
              }}
            />
            <div css={{ position: "absolute", right: "4px", top: "6px" }}>
              <SvgMagnifyingGlass size="small" />
            </div>
          </div>
        </div>
        {loading && searchText && <Text>Searching...</Text>}
        {data && searchText && (
          <Text>
            {unopenedPinboards.length > 0
              ? "Shift + click opens in new Composer tab"
              : "No results, please adjust your search..."}
          </Text>
        )}
        {data &&
          unopenedPinboards
            .slice(0, MAX_PINBOARDS_TO_DISPLAY)
            .map(OpenPinboardButton)}
        {unopenedPinboards.length > MAX_PINBOARDS_TO_DISPLAY && (
          <Text>Too many results, please refine your search...</Text>
        )}

        <div css={{ flexGrow: 1 }} />
        <div
          css={{
            borderTop: `1px solid ${palette.neutral["86"]}`,
            paddingTop: `${space["1"]}px`,
          }}
        >
          {/* TODO move this to some settings menu (rather than bottom of selection list) */}
          <div ref={useTourStepRef("notificationSetting")}>
            <PushNotificationPreferencesOpener
              hasWebPushSubscription={hasWebPushSubscription}
            />
          </div>
        </div>
      </div>
    </>
  );
};
