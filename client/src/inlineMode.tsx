import React, { useEffect, useMemo } from "react";
import { InlinePinboardTogglePortal } from "./inlinePinboardToggle";
import { useLazyQuery, useQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../gql";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";

interface InlineModeProps {
  workflowTitleElements: HTMLElement[];
}

export const InlineMode = ({ workflowTitleElements }: InlineModeProps) => {
  const workflowTitleElementLookup = useMemo(
    () =>
      workflowTitleElements.reduce((acc, node) => {
        const pinboardId = node.parentElement?.id?.replace("stub-", "");
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

  const itemCounts: PinboardIdWithItemCounts[] =
    itemCountsQuery.data?.getItemCounts || [];

  const itemCountsLookup = itemCounts.reduce(
    (lookup, element: PinboardIdWithItemCounts) => ({
      ...lookup,
      [element.pinboardId]: element,
    }),
    {} as Record<string, PinboardIdWithItemCounts>
  );

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
          />
        )
      )}
    </React.Fragment>
  );
};
