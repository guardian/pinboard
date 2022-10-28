import { css, Global } from "@emotion/react";
import React, { useEffect, useRef } from "react";
import { bottom, boxShadow, floatySize, panelCornerSize, top } from "./styling";
import { Pinboard } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { neutral, palette, space } from "@guardian/source-foundations";
import { Navigation } from "./navigation";
import { useGlobalStateContext } from "./globalState";
import { getTooltipText } from "./util";
import { dropTargetCss, IsDropTargetProps } from "./drop";
import { ChatTab } from "./types/Tab";
import { pinboard } from "../colours";

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
    boundedPositionTranslation,
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

  const isLeftHalf =
    Math.abs(boundedPositionTranslation.x) > window.innerWidth / 2;
  const isTopHalf =
    Math.abs(boundedPositionTranslation.y) > window.innerHeight / 2;

  return (
    <div
      css={css`
        position: fixed;
        z-index: 99998;
        background: ${neutral[93]};
        box-shadow: ${boxShadow};
        width: 260px;
        transform: translateX(${isLeftHalf ? "100%" : 0});
        top: ${
          isTopHalf
            ? `calc(100vh + ${
                space[2] + panelCornerSize + boundedPositionTranslation.y
              }px)`
            : `${top}px`
        };
        bottom: ${
          isTopHalf
            ? bottom
            : Math.abs(boundedPositionTranslation.y) +
              floatySize +
              space[2] +
              panelCornerSize
        }px;
        right: ${Math.abs(boundedPositionTranslation.x) + floatySize / 2}px;
        display: ${isExpanded ? "flex" : "none"};
        flex-direction: column;
        font-family: sans-serif;
        border-radius: 4px;
        border-${isTopHalf ? "top" : "bottom"}-${
        isLeftHalf ? "left" : "right"
      }-radius: 0;
      `}
      ref={panelRef}
    >
      <div
        css={css`
          position: absolute;
          background: ${isTopHalf ? pinboard["500"] : neutral[93]};
          width: ${panelCornerSize}px;
          height: ${panelCornerSize}px;
          ${isTopHalf ? "top" : "bottom"}: -${panelCornerSize - 1}px;
          ${isLeftHalf ? "left" : "right"}: 0;
          right: 0;
          border-${isTopHalf ? "top" : "bottom"}-${
          isLeftHalf ? "right" : "left"
        }-radius: ${panelCornerSize}px;
          box-shadow: ${boxShadow};
          clip: rect(${
            isTopHalf ? -5 : 0
          }px, 50px, 50px, -25px); // clip off the top of the shadow FIXME make relative
      `}
      />
      {isDropTarget && <div css={{ ...dropTargetCss }} />}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPinboardId={selectedPinboardId}
        clearSelectedPinboard={clearSelectedPinboard}
        headingTooltipText={
          selectedPinboard && getTooltipText(selectedPinboard)
        }
        isTopHalf={isTopHalf}
        isLeftHalf={isLeftHalf}
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

      <Global
        styles={{
          "@keyframes highlight-item": {
            "0%": {
              background: "initial",
            },
            "50%": {
              background: palette.neutral[86],
            },
            "100%": {
              background: "initial",
            },
          },
        }}
      />

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
