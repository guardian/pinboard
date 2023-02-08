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
import { PinboardData } from "../../../shared/graphql/extraTypes";

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  selectedPinboard: PinboardData | null | undefined;
  clearSelectedPinboard: () => void;
  headingTooltipText: string | undefined;
  isTopHalf: boolean;
  isLeftHalf: boolean;
  closeButtonOverride?: () => void;
  forceTabDisplay?: true;
}
export const Navigation = ({
  isTopHalf,
  isLeftHalf,
  selectedPinboard,
  ...props
}: PropsWithChildren<NavigationProps>) => {
  const {
    setIsExpanded,
    hasUnreadOnOtherPinboard,
    preselectedPinboard,
    openPinboardInNewTab,
  } = useGlobalStateContext();
  // TODO replace with notification count when we have it
  const unreadNotificationCountOnOtherPinboard =
    selectedPinboard && hasUnreadOnOtherPinboard(selectedPinboard.id)
      ? 0
      : undefined;
  return (
    <div
      css={css`
        background-color: ${pinboard[500]};
        border-top-${isLeftHalf ? "right" : "left"}-radius: 4px;
        ${
          isTopHalf
            ? ""
            : `border-top-${isLeftHalf ? "left" : "right"}-radius: 4px;`
        }
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
        {selectedPinboard && (
          <NavButton
            onClick={props.clearSelectedPinboard}
            icon={BackArrowIcon}
            unreadCount={unreadNotificationCountOnOtherPinboard}
            title="View other pinboards"
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
        {selectedPinboard?.composerId && !preselectedPinboard && (
          <NavButton
            icon={ComposerIcon}
            onClick={() => openPinboardInNewTab(selectedPinboard)}
            title="Open in Composer"
          />
        )}
        <NavButton
          onClick={() =>
            props.closeButtonOverride
              ? props.closeButtonOverride()
              : setIsExpanded(false)
          }
          icon={CrossIcon}
          title="Collapse the Pinboard window"
        />
      </div>

      {(selectedPinboard || props.forceTabDisplay) && (
        <Tabs
          activeTab={props.activeTab}
          setActiveTab={props.setActiveTab}
          unreadMessages={null} // ready for when we have unread messages count to display
        />
      )}
    </div>
  );
};
