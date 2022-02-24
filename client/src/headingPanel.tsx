import React, { PropsWithChildren } from "react";
import { css } from "@emotion/react";
import { pinboard } from "../colours";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";
import {
  SvgChevronLeftSingle,
  SvgCross,
} from "@guardian/source-react-components";
import { useGlobalStateContext } from "./globalState";
import { PinboardData } from "./pinboard";
import type { Tab } from "./types/Tab";

const BackArrowIcon: React.FC = () => <SvgChevronLeftSingle size="xsmall" />;
const CrossIcon: React.FC = () => <SvgCross size="xsmall" />;

interface HeadingButtonProps {
  onClick?: () => void;
  icon: React.FC;
  hoverParent?: boolean;
}
export const HeadingButton: React.FC<HeadingButtonProps> = ({
  onClick,
  icon: Icon,
  hoverParent,
}) => (
  <span
    onClick={onClick}
    css={css`
      height: 24px;
      width: 24px;
      border-radius: 24px;
      ${hoverParent ? "*:hover > &" : "&:hover"} {
        background-color: ${pinboard[800]};
        cursor: pointer;
      }
      display: flex;
      justify-content: center;
      align-items: center;
    `}
  >
    <Icon />
  </span>
);

interface HeadingPanelProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  selectedPinboard: PinboardData | undefined;
  clearSelectedPinboard: () => void;
}
export const HeadingPanel = (props: PropsWithChildren<HeadingPanelProps>) => {
  const { setIsExpanded } = useGlobalStateContext();
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
        {props.selectedPinboard && (
          <HeadingButton
            onClick={props.clearSelectedPinboard}
            icon={BackArrowIcon}
          />
        )}
        <span
          css={css`
            flex-grow: 1;
            color: ${palette.neutral[20]};
          `}
        >
          {props.children}
        </span>
        <HeadingButton onClick={() => setIsExpanded(false)} icon={CrossIcon} />
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
