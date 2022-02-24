import React from "react";
import { css } from "@emotion/react";
import { pinboard } from "../colours";
import { neutral, palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import { Tab } from "./types/Tab";
import { HeadingButton } from "./headingPanel";
import { SvgSpeechBubble } from "@guardian/source-react-components";
import Paperclip from "../icons/paperclip.svg";

const SpeechBubbleIcon: React.FC = () => <SvgSpeechBubble size="xsmall" />;
const ClipIcon: React.FC = () => <Paperclip />;

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
        flex-grow: 1;
        display: flex;
        justify-content: center;
        border-bottom: ${activeTab === "chat"
          ? `2px solid ${neutral[20]}`
          : "none"};
        cursor: pointer;
      `}
      onClick={() => setActiveTab("chat")}
    >
      <HeadingButton icon={SpeechBubbleIcon} hoverParent={true} />
      {unreadMessages !== null && (
        <div
          css={css`
            position: relative;
            top: -4px;
            left: -10px;
            border: 2px solid ${pinboard[500]};
            user-select: none;
            background-color: ${palette.neutral[20]};
            min-width: ${space[2]}px;
            padding: 0 ${space[1]}px;
            height: ${space[4]}px;
            border-radius: ${space[3]}px;
            ${agateSans.xxsmall({ lineHeight: "regular" })}
            color: ${palette.neutral[100]};
            text-align: center;
            *:hover > & {
              border-color: ${pinboard[800]};
            }
          `}
        >
          {unreadMessages > 0 && unreadMessages}
        </div>
      )}
    </div>
    <div
      css={css`
        flex-grow: 1;
        display: flex;
        justify-content: center;
        border-bottom: ${activeTab === "asset"
          ? `2px solid ${neutral[20]}`
          : "none"};
        cursor: pointer;
      `}
      onClick={() => setActiveTab("asset")}
    >
      <HeadingButton icon={ClipIcon} hoverParent={true} />
    </div>
  </div>
);
