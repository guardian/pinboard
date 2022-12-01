import React, { useEffect, useMemo, useState } from "react";
import { InlinePinboardTogglePortal } from "./inlinePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../gql";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";

export const WORKFLOW_TITLE_QUERY_SELECTOR =
  ".content-list-item__field--pinboard";

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
