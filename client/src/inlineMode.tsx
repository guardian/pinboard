import React, { useEffect, useMemo, useState } from "react";
import { InlinePinboardTogglePortal } from "./inlinePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../gql";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { InlineModePanel } from "./inlineModePanel";
import ReactDOM from "react-dom";
import { useThrottle } from "./util";

export const WORKFLOW_PINBOARD_ELEMENTS_QUERY_SELECTOR =
  ".content-list-item__field--pinboard";

interface InlineModeProps {
  workflowPinboardElements: HTMLElement[];
}

const isElementFullyVisibleVerticallyInContainer = (
  element: HTMLElement,
  container: HTMLElement,
  containerTopOffset: number
) => {
  const { bottom, top } = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return (
    top > containerRect.top + containerTopOffset &&
    bottom < containerRect.bottom
  );
};

export const InlineMode = ({ workflowPinboardElements }: InlineModeProps) => {
  const scrollableArea = useMemo(
    () => document.getElementById("scrollable-area"),
    []
  );
  const pinboardArea = useMemo(
    () => document.getElementById("pinboard-area"),
    []
  );
  const workflowTitleElementLookup = useMemo(
    () =>
      workflowPinboardElements.reduce((acc, node) => {
        const { pinboardId } = node.dataset;
        return pinboardId ? { ...acc, [pinboardId]: node } : acc;
      }, {} as Record<string, HTMLElement>),
    [workflowPinboardElements]
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

  const maybeSelectedNode =
    maybeSelectedPinboardId &&
    workflowTitleElementLookup[maybeSelectedPinboardId];

  useEffect(() => {
    const containerScrollHandler = useThrottle(() => {
      // allow scrolling left to right, but if the user scrolls the row out of the container then dismiss the panel
      if (
        maybeSelectedNode &&
        maybeSelectedNode.parentElement &&
        scrollableArea &&
        !isElementFullyVisibleVerticallyInContainer(
          maybeSelectedNode.parentElement,
          scrollableArea,
          68
        )
      ) {
        setMaybeSelectedPinboardId(null);
      }
    }, 100);

    maybeSelectedNode &&
      scrollableArea?.addEventListener("scroll", containerScrollHandler);
    return () => {
      scrollableArea?.removeEventListener("scroll", containerScrollHandler);
    };
  }, [maybeSelectedNode, scrollableArea]);

  return (
    <React.Fragment>
      {maybeSelectedNode &&
        pinboardArea &&
        ReactDOM.createPortal(
          <InlineModePanel
            pinboardId={maybeSelectedPinboardId}
            closePanel={() => setMaybeSelectedPinboardId(null)}
            workingTitle={maybeSelectedNode.dataset.workingTitle || null}
            headline={maybeSelectedNode.dataset.headline || null}
          />,
          pinboardArea
        )}
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
