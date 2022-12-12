import React, { useEffect, useMemo, useState } from "react";
import { InlineModePinboardTogglePortal } from "./inlineModePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../../gql";
import { PinboardIdWithItemCounts } from "../../../shared/graphql/graphql";
import { InlineModePanel } from "./inlineModePanel";
import ReactDOM from "react-dom";
import { throttled } from "../util";
import { InlineModeWorkflowColumnHeading } from "./inlineModeWorkflowColumnHeading";

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
  const pinboardColumnHeadingElement = useMemo(
    () => document.querySelector(".content-list-head__heading--pinboard"),
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

  const [itemCountsLookup, setItemCountsLookup] = useState<
    Record<string, PinboardIdWithItemCounts>
  >({});

  const [fetchItemCounts, { stopPolling, startPolling }] = useLazyQuery(
    gqlGetItemCounts
  );

  useEffect(() => {
    stopPolling();
    const pinboardIds = Object.keys(workflowTitleElementLookup);
    if (pinboardIds.length > 0) {
      fetchItemCounts({
        variables: { pinboardIds },
        onCompleted: (data) =>
          setItemCountsLookup(
            ((data?.getItemCounts as PinboardIdWithItemCounts[]) || []).reduce(
              (lookup, element: PinboardIdWithItemCounts) => ({
                ...lookup,
                [element.pinboardId]: element,
              }),
              Object.fromEntries(
                pinboardIds.map((pinboardId) => [
                  pinboardId,
                  { pinboardId, totalCount: 0, unreadCount: 0 },
                ])
              ) as Record<string, PinboardIdWithItemCounts>
            )
          ),
      });
      startPolling(5000);
    }
  }, [workflowTitleElementLookup]);

  const [maybeSelectedPinboardId, setMaybeSelectedPinboardId] = useState<
    string | null
  >(null);

  const maybeSelectedNode =
    maybeSelectedPinboardId &&
    workflowTitleElementLookup[maybeSelectedPinboardId];

  useEffect(() => {
    const containerScrollHandler = throttled(() => {
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
      {pinboardColumnHeadingElement &&
        ReactDOM.createPortal(
          <InlineModeWorkflowColumnHeading />,
          pinboardColumnHeadingElement
        )}
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
          <InlineModePinboardTogglePortal
            key={index}
            node={node}
            pinboardId={pinboardId}
            counts={itemCountsLookup[pinboardId]}
            isSelected={pinboardId === maybeSelectedPinboardId}
            setMaybeSelectedPinboardId={(pinboardId: string | null) => {
              setMaybeSelectedPinboardId(null); // trigger unmount first
              setTimeout(() => setMaybeSelectedPinboardId(pinboardId), 1);
            }}
          />
        )
      )}
    </React.Fragment>
  );
};
