import React, { useEffect, useMemo, useRef, useState } from "react";
import { InlinePinboardTogglePortal } from "./inlinePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../gql";
import { PinboardIdWithItemCounts } from "../../shared/graphql/graphql";
import { css } from "@emotion/react";
import { neutral, space } from "@guardian/source-foundations";
import { boxShadow } from "./styling";
import { Pinboard } from "./pinboard";

export const WORKFLOW_TITLE_QUERY_SELECTOR =
  ".content-list-item__field--priority";

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

  const [maybeSelectedPinboardId, setMaybeSelectedPinboardId] = useState<
    string | null
  >(null);

  const panelRef = useRef(null);

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
      {maybeSelectedPinboardId && (
        <div
          ref={panelRef}
          css={css`
            position: absolute;
            display: flex;
            flex-direction: column;
            z-index: 99998;
            top: ${space[5]}px;
            height: calc(100vh - 400px);
            margin-left: 250px;
            background: ${neutral[93]};
            box-shadow: ${boxShadow};
            width: 260px;
          `}
        >
          <Pinboard
            pinboardId={maybeSelectedPinboardId}
            isSelected
            isExpanded
            panelElement={panelRef.current}
          />
        </div>
      )}
    </React.Fragment>
  );
};
