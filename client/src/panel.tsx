import { css } from "@emotion/react";
import React, { useRef } from "react";
import { pinboard } from "../colours";
import { bottom, boxShadow, floatySize, right } from "./styling";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { Pinboard } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { useGlobalStateContext } from "./globalState";

export const Panel: React.FC = () => {
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    isExpanded,
    activePinboards,
    selectedPinboardId,
    preselectedPinboard,
  } = useGlobalStateContext();

  return (
    <div
      css={css`
        position: fixed;
        z-index: 99998;
        background: white;
        box-shadow: ${boxShadow};
        border: 2px ${pinboard[500]} solid;
        width: 250px;
        height: calc(100vh - 100px);
        bottom: ${bottom + floatySize / 2 - 5}px;
        right: ${right + floatySize / 2 - 5}px;
        display: ${isExpanded ? "flex" : "none"};
        flex-direction: column;
        justify-content: space-between;
        font-family: sans-serif;
      `}
      ref={panelRef}
    >
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
