import React, { useEffect, useRef } from "react";
import { css, Global } from "@emotion/react";
import { highlightItemsKeyFramesCSS } from "../styling";
import { pinboard } from "../../colours";
import { Pinboard } from "../pinboard";
import { Navigation } from "../navigation";
import { useGlobalStateContext } from "../globalState";
import { getTooltipText } from "../util";
import root from "react-shadow/emotion";
import { neutral } from "@guardian/source-foundations";
import { ErrorOverlay } from "../errorOverlay";

export const INLINE_PANEL_WIDTH = 260;

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
  const { hasError, activeTab, setActiveTab } = useGlobalStateContext();

  const panelRef = useRef(null);

  useEffect(() => {
    const result = document.getElementById("scrollable-area");
    if (result) {
      const borderLeft = result.style.borderLeft;
      result.style.borderLeft = "none";
      return () => {
        result.style.borderLeft = borderLeft;
      };
    }
  }, []);

  return (
    <root.div
      style={{
        display: "flex",
        minHeight: "100%",
        maxHeight: "100%",
        background: pinboard[500],
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1} // to ensure the below keypress handler fires
        onKeyDown={(e) => e.key === "Escape" && closePanel()} // escape never fires onKeyPress
        ref={panelRef}
        css={css`
          display: flex;
          flex-direction: column;
          background: ${neutral[93]};
          min-width: ${INLINE_PANEL_WIDTH}px;
          max-width: ${INLINE_PANEL_WIDTH}px;
          border: solid ${pinboard["500"]};
          border-width: 0 3px;
          min-height: 100%;
          max-height: 100%;
          border-radius: 6px;
          position: relative;
        `}
      >
        {hasError && <ErrorOverlay />}
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
          isInteractiveDemoActive={false}
          resetTour={() => void 0}
        />
      </div>
    </root.div>
  );
};
