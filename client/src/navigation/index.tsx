import React, { PropsWithChildren } from "react";
import { css } from "@emotion/react";
import { pinboard } from "../../colours";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import { useGlobalStateContext } from "../globalState";
import type { Tab } from "../types/Tab";
import { BackArrowIcon, ComposerIcon, CrossIcon } from "./icon";
import { NavButton } from "./button";
import { Tabs } from "./tabs";

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  selectedPinboardId: string | null | undefined;
  clearSelectedPinboard: () => void;
  headingTooltipText: string | undefined;
}
export const Navigation = (props: PropsWithChildren<NavigationProps>) => {
  const {
    setIsExpanded,
    hasUnreadOnOtherPinboard,
    preselectedPinboard,
    activePinboards,
    openPinboard,
  } = useGlobalStateContext();
  // TODO replace with notification count when we have it
  const unreadNotificationCountOnOtherPinboard =
    props.selectedPinboardId &&
    hasUnreadOnOtherPinboard(props.selectedPinboardId)
      ? 0
      : undefined;
  const selectedPinboard = activePinboards.find(
    (activePinboard) => activePinboard.id === props.selectedPinboardId
  );
  return (
    <div
      css={css`
        background-color: ${pinboard[500]};
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px;
        clip-path: inset(0 0 -40px 0);
      `}
    >
      <div
        css={css`
          ${agateSans.xxsmall({ fontWeight: "bold" })};
          margin: ${space[1]}px;
          display: flex;
          gap: ${space[1]}px;
          height: 24px;
          align-items: center;
        `}
        title={props.headingTooltipText}
      >
        {props.selectedPinboardId && (
          <NavButton
            onClick={props.clearSelectedPinboard}
            icon={BackArrowIcon}
            unreadCount={unreadNotificationCountOnOtherPinboard}
            title="Open another pinboard"
          />
        )}
        <span
          css={css`
            flex-grow: 1;
            margin: 0 ${space[1]}px;
            color: ${palette.neutral[20]};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          `}
        >
          {props.children}
        </span>
        {selectedPinboard && !preselectedPinboard && (
          <NavButton
            icon={ComposerIcon}
            onClick={() => openPinboard(selectedPinboard, true)}
            title="Open in Composer"
          />
        )}
        <NavButton
          onClick={() => setIsExpanded(false)}
          icon={CrossIcon}
          title="Close the Pinboard window"
        />
      </div>

      {props.selectedPinboardId && (
        <Tabs
          activeTab={props.activeTab}
          setActiveTab={props.setActiveTab}
          unreadMessages={null} // ready for when we have unread messages count to display
        />
      )}
    </div>
  );
};
