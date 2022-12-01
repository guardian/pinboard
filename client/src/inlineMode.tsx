import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  INLINE_TOGGLE_WIDTH,
  InlinePinboardTogglePortal,
} from "./inlinePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../gql";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { css, Global } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import { boxShadow, highlightItemsKeyFramesCSS } from "./styling";
import { pinboard } from "../colours";
import { Pinboard } from "./pinboard";

export const WORKFLOW_TITLE_QUERY_SELECTOR =
  ".content-list-item__field--pinboard";

export const INLINE_PANEL_WIDTH = 260;

interface InlineModeProps {
  workflowTitleElements: HTMLElement[];
}

export const InlineMode = ({ workflowTitleElements }: InlineModeProps) => {
  const workflowTitleElementLookup = useMemo(
    () =>
      workflowTitleElements.reduce((acc, node) => {
        const { pinboardId } = node.dataset;
        return pinboardId ? { ...acc, [pinboardId]: node } : acc;
      }, {} as Record<string, HTMLElement>),
    [workflowTitleElements]
  );

  const [fetchItemCounts, itemCountsQuery] = useLazyQuery(gqlGetItemCounts);

  useEffect(() => {
    itemCountsQuery.stopPolling();
    const pinboardIds = Object.keys(workflowTitleElementLookup);
    if (pinboardIds.length > 0) {
      fetchItemCounts({ variables: { pinboardIds } });
      itemCountsQuery.startPolling(5000);
    }
  }, [workflowTitleElementLookup]);

  const itemCountsLookup = useMemo(
    () =>
      (
        (itemCountsQuery.data?.getItemCounts as PinboardIdWithItemCounts[]) ||
        []
      ).reduce(
        (lookup, element: PinboardIdWithItemCounts) => ({
          ...lookup,
          [element.pinboardId]: element,
        }),
        {} as Record<string, PinboardIdWithItemCounts>
      ),
    [itemCountsQuery.data]
  );

  const [maybeSelectedPinboardId, setMaybeSelectedPinboardId] = useState<
    string | null
  >(null);

  useEffect(() => {
    document
      .getElementById("scrollable-area")
      ?.addEventListener("scroll", () => setMaybeSelectedPinboardId(null));
  }, []);

  return (
    <React.Fragment>
      {Object.entries(workflowTitleElementLookup).map(
        ([pinboardId, node], index) => (
          <InlinePinboardTogglePortal
            key={index}
            node={node}
            pinboardId={pinboardId}
            counts={itemCountsLookup[pinboardId]}
            isLoading={itemCountsQuery.loading}
            isSelected={pinboardId === maybeSelectedPinboardId}
            setMaybeSelectedPinboardId={setMaybeSelectedPinboardId}
          />
        )
      )}
    </React.Fragment>
  );
};

interface InlineModePanelProps {
  pinboardId: string;
}

export const InlineModePanel = ({ pinboardId }: InlineModePanelProps) => {
  const panelRef = useRef(null);

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
        left: ${(document
          .querySelector(".content-list-head__heading--pinboard")
          ?.getBoundingClientRect()?.left || 0) +
        INLINE_TOGGLE_WIDTH +
        25}px;
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
