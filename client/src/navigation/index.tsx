import React, { PropsWithChildren } from "react";
import { css } from "@emotion/react";
import { pinboard } from "../../colours";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../../fontNormaliser";
import { useGlobalStateContext } from "../globalState";
import type { Tab } from "../types/Tab";
import { BackArrowIcon, CrossIcon } from "./icon";
import { NavButton } from "./button";

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  selectedPinboardId: string | null | undefined;
  clearSelectedPinboard: () => void;
}
export const Navigation = (props: PropsWithChildren<NavigationProps>) => {
  const { setIsExpanded, hasUnreadOnOtherPinboard } = useGlobalStateContext();
  // TODO replace with notification count when we have it
  const unreadNotificationCountOnOtherPinboard =
    props.selectedPinboardId &&
    hasUnreadOnOtherPinboard(props.selectedPinboardId)
      ? 0
      : undefined;
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
      >
        {props.selectedPinboardId && (
          <NavButton
            onClick={props.clearSelectedPinboard}
            icon={BackArrowIcon}
            unreadCount={unreadNotificationCountOnOtherPinboard}
          />
        )}
        <span
          css={css`
            flex-grow: 1;
            margin: 0 ${space[1]}px;
            color: ${palette.neutral[20]};
          `}
        >
          {props.children}
        </span>
        <NavButton onClick={() => setIsExpanded(false)} icon={CrossIcon} />
      </div>

      {/* TODO re-enable tabs when we implement & enable asset view */}
      {/* {props.selectedPinboard && (
        <Tabs
          activeTab={props.activeTab}
          setActiveTab={props.setActiveTab}
          unreadMessages={null} // ready for when we have unread messages count to display
        />
      )} */}
    </div>
  );
};
