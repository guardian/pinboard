import React, { useMemo, useRef } from "react";
import { css, Global } from "@emotion/react";
import { INLINE_TOGGLE_WIDTH } from "./inlinePinboardToggle";
import { neutral } from "@guardian/source-foundations";
import { boxShadow, highlightItemsKeyFramesCSS } from "./styling";
import { pinboard } from "../colours";
import { Pinboard } from "./pinboard";

export const INLINE_PANEL_WIDTH = 260;

interface InlineModePanelProps {
  pinboardId: string;
}

export const InlineModePanel = ({ pinboardId }: InlineModePanelProps) => {
  const panelRef = useRef(null);

  const viewportLeft = useMemo(
    () =>
      document
        .querySelector(".content-list-head__heading--pinboard")
        ?.getBoundingClientRect()?.left || 0,
    []
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
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
        border-radius: 5px;
      `}
    >
      <Global styles={highlightItemsKeyFramesCSS} />

      <Pinboard
        pinboardId={pinboardId}
        isSelected
        isExpanded
        panelElement={panelRef.current}
      />
    </div>
  );
};
