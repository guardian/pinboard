import { css } from "@emotion/react";
import React, { useEffect, useRef } from "react";
import {
  bottom,
  boxShadow,
  floatySize,
  panelCornerSize,
  right,
} from "./styling";
import { Pinboard } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { neutral, space } from "@guardian/source-foundations";
import { Navigation } from "./navigation";
import { useGlobalStateContext } from "./globalState";
import { getTooltipText } from "./util";
import { dropTargetCss, IsDropTargetProps } from "./drop";
import { ChatTab } from "./types/Tab";

export const Panel: React.FC<IsDropTargetProps> = ({ isDropTarget }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    isExpanded,
    activePinboards,
    activePinboardIds,
    selectedPinboardId,
    clearSelectedPinboard,
    activeTab,
    setActiveTab,
  } = useGlobalStateContext();

  const selectedPinboard = activePinboards.find(
    (activePinboard) => activePinboard.id === selectedPinboardId
  );

  const title = (() => {
    if (selectedPinboard?.isNotFound) {
      return "PINBOARD NOT FOUND";
    }
    if (selectedPinboardId) {
      return selectedPinboard?.title || "Loading pinboard...";
    }
    return "Select a pinboard";
  })();

  useEffect(() => {
    setActiveTab(ChatTab);
  }, [selectedPinboardId]);

  return (
    <div
      css={css`
        position: fixed;
        z-index: 99998;
        background: ${neutral[93]};
        box-shadow: ${boxShadow};
        width: 260px;
        height: 68vh;
        min-height: 380px;
        max-height: min(
          800px,
          calc(98vh - ${bottom + floatySize + space[4] + panelCornerSize}px)
        );
        bottom: ${bottom + floatySize + space[2] + panelCornerSize}px;
        right: ${right + floatySize / 2}px;
        display: ${isExpanded ? "flex" : "none"};
        flex-direction: column;
        font-family: sans-serif;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;

        &::after {
          content: "";
          position: fixed;
          background: ${neutral[93]};
          width: ${panelCornerSize}px;
          height: ${panelCornerSize}px;
          bottom: ${bottom + floatySize + space[2]}px;
          right: ${right + floatySize / 2}px;
          border-bottom-left-radius: ${panelCornerSize}px;
          box-shadow: ${boxShadow};
          clip: rect(0, 50px, 50px, -25px); // clip off the top of the shadow
        }
      `}
      ref={panelRef}
    >
      {isDropTarget && <div css={{ ...dropTargetCss }} />}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPinboardId={selectedPinboardId}
        clearSelectedPinboard={clearSelectedPinboard}
        headingTooltipText={
          selectedPinboard && getTooltipText(selectedPinboard)
        }
      >
        <span
          css={{
            textDecoration: selectedPinboard?.trashed
              ? "line-through"
              : undefined,
            fontStyle: selectedPinboard?.isNotFound ? "italic" : undefined,
          }}
        >
          {title}
        </span>
      </Navigation>

      {!selectedPinboardId && <SelectPinboard />}

      {
        // The active pinboards are always mounted, so that we receive new item notifications
        // Note that the pinboard hides itself based on 'isSelected' prop
        activePinboardIds.map((pinboardId) => (
          <Pinboard
            key={pinboardId}
            pinboardId={pinboardId}
            isExpanded={pinboardId === selectedPinboardId && isExpanded}
            isSelected={pinboardId === selectedPinboardId}
            panelElement={panelRef.current}
          />
        ))
      }
    </div>
  );
};
