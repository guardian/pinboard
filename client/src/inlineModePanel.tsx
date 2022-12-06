import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { css, Global } from "@emotion/react";
import { INLINE_TOGGLE_WIDTH } from "./inlinePinboardToggle";
import { neutral } from "@guardian/source-foundations";
import { boxShadow, highlightItemsKeyFramesCSS } from "./styling";
import { pinboard } from "../colours";
import { Pinboard } from "./pinboard";
import { Navigation } from "./navigation";
import { useGlobalStateContext } from "./globalState";
import { getTooltipText } from "./util";

export const INLINE_PANEL_WIDTH = 260;

const getViewportLeftPosition = () =>
  document
    .querySelector(".content-list-head__heading--pinboard")
    ?.getBoundingClientRect()?.left || 0;

interface InlineModePanelProps {
  pinboardId: string;
  closePanel: () => void;
  workingTitle: string | null;
  headline: string | null;
}

export const InlineModePanel = ({
  pinboardId,
  closePanel,
  workingTitle,
  headline,
}: InlineModePanelProps) => {
  const { hasBrowserFocus } = useGlobalStateContext();
  const { activeTab, setActiveTab } = useGlobalStateContext();

  const panelRef = useRef(null);

  const [viewportLeft, setViewportLeft] = useState<number>(
    getViewportLeftPosition()
  );

  useLayoutEffect(() => {
    // since the InlineToggleButton expands its width when 'selected', we need to
    // allow a little time for Angular to resize the column before we can calculate left position
    setTimeout(() => setViewportLeft(getViewportLeftPosition()), 100);
  }, []);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1} // to ensure the below keypress handler fires
      onKeyDown={(e) => e.key === "Escape" && closePanel()} // escape never fires onKeyPress
      ref={panelRef}
      css={css`
        position: fixed;
        display: flex;
        flex-direction: column;
        z-index: 3;
        top: 100px;
        bottom: 5px;
        left: ${viewportLeft + INLINE_TOGGLE_WIDTH + 25}px;
        background: ${neutral[93]};
        box-shadow: ${boxShadow};
        width: ${INLINE_PANEL_WIDTH}px;
        border: 3px solid ${pinboard["500"]};
        ${hasBrowserFocus ? "border-top: none;" : ""}
        border-radius: 5px;
      `}
    >
      <Global styles={highlightItemsKeyFramesCSS} />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPinboard={null}
        clearSelectedPinboard={closePanel}
        headingTooltipText={getTooltipText(workingTitle, headline)}
        isTopHalf={false}
        isLeftHalf={false}
        closeButtonOverride={closePanel}
        forceTabDisplay
      >
        {workingTitle}
      </Navigation>
      <Pinboard
        pinboardId={pinboardId}
        isSelected
        isExpanded
        panelElement={panelRef.current}
      />
    </div>
  );
};
