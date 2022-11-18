import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  INLINE_TOGGLE_WIDTH,
  InlinePinboardTogglePortal,
} from "./inlinePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../gql";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import { boxShadow } from "./styling";
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
            offsetTop={node.offsetTop}
          />
        )
      )}
    </React.Fragment>
  );
};

interface InlineModePanelProps {
  pinboardId: string;
  offsetTop: number;
}

export const InlineModePanel = ({
  pinboardId,
  offsetTop,
}: InlineModePanelProps) => {
  const panelRef = useRef(null);
  const marginTop = useMemo(
    () =>
      50 +
      (document.getElementById("scrollable-area")?.scrollTop || 0) -
      offsetTop,
    []
  );
  return (
    <div
      ref={panelRef}
      css={css`
        position: absolute;
        display: flex;
        flex-direction: column;
        z-index: 3;
        margin-top: ${marginTop}px;
        height: calc(100vh - 200px);
        margin-left: ${INLINE_TOGGLE_WIDTH + 25}px;
        background: ${neutral[93]};
        box-shadow: ${boxShadow};
        width: ${INLINE_PANEL_WIDTH}px;
        border: 3px solid ${pinboard["500"]};
        border-radius: 5px;
      `}
    >
      <Pinboard
        pinboardId={pinboardId}
        isSelected
        isExpanded
        panelElement={panelRef.current}
      />
    </div>
  );
};
