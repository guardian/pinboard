import { css } from "@emotion/react";
import React, { useRef, useState } from "react";
import { bottom, boxShadow, floatySize, right } from "./styling";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { Pinboard } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { neutral, space } from "@guardian/source-foundations";
import { Navigation } from "./navigation";
import { ChatTab, Tab as Tab } from "./types/Tab";
import { useGlobalStateContext } from "./globalState";

const cornerSize = 24;

export const Panel: React.FC = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    isExpanded,
    activePinboards,
    selectedPinboardId,
    preselectedPinboard,
    clearSelectedPinboard,
  } = useGlobalStateContext();

  const [activeTab, setActiveTab] = useState<Tab>(ChatTab);

  const selectedPinboard = activePinboards.find(
    (ap) => ap.id === selectedPinboardId
  );

  const title =
    selectedPinboard?.title ||
    (preselectedPinboard === "notTrackedInWorkflow"
      ? "No pinboard"
      : "Select a pinboard");

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
          calc(98vh - ${bottom + floatySize + space[4] + cornerSize}px)
        );
        bottom: ${bottom + floatySize + space[2] + cornerSize}px;
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
          width: ${cornerSize}px;
          height: ${cornerSize}px;
          bottom: ${bottom + floatySize + space[2]}px;
          right: ${right + floatySize / 2}px;
          border-bottom-left-radius: ${cornerSize}px;
          box-shadow: ${boxShadow};
          clip: rect(0, 50px, 50px, -25px); // clip off the top of the shadow
        }
      `}
      ref={panelRef}
    >
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPinboard={selectedPinboard}
        clearSelectedPinboard={clearSelectedPinboard}
      >
        {title}
      </Navigation>

      {preselectedPinboard === "notTrackedInWorkflow" ? (
        <NotTrackedInWorkflow />
      ) : (
        !selectedPinboardId && <SelectPinboard />
      )}

      {
        // The active pinboards are always mounted, so that we receive new item notifications
        // Note that the pinboard hides itself based on 'isSelected' prop
        activePinboards.map((pinboardData) => (
          <Pinboard
            pinboardData={pinboardData}
            key={pinboardData.id}
            isExpanded={pinboardData.id === selectedPinboardId && isExpanded}
            isSelected={pinboardData.id === selectedPinboardId}
            panelElement={panelRef.current}
          />
        ))
      }
    </div>
  );
};
