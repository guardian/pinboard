import React from "react";
import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import { Tab } from "../types/Tab";
import { NavButton } from "./button";
import { ClipIcon, SpeechBubbleIcon } from "./icon";
import { useTourStepRef } from "../tour/tourState";

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  unreadMessages: number | null;
}
export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  setActiveTab,
  unreadMessages,
}) => (
  <div
    css={css`
      display: flex;
    `}
  >
    <div
      css={css`
        flex: 1 1 0;
        display: flex;
        justify-content: center;
        border-bottom: ${activeTab === "chat"
          ? `2px solid ${neutral[20]}`
          : "none"};
        cursor: pointer;
      `}
      onClick={() => setActiveTab("chat")}
    >
      <NavButton
        icon={SpeechBubbleIcon}
        hoverParent={true}
        unreadCount={unreadMessages}
      />
    </div>
    <div
      css={css`
        flex: 1 1 0;
        display: flex;
        justify-content: center;
        border-bottom: ${activeTab === "asset"
          ? `2px solid ${neutral[20]}`
          : "none"};
        cursor: pointer;
      `}
      ref={useTourStepRef("assetView")}
      onClick={() => setActiveTab("asset")}
    >
      <NavButton icon={ClipIcon} hoverParent={true} />
    </div>
  </div>
);
