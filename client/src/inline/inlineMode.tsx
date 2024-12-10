import React, { useEffect, useMemo, useState } from "react";
import { InlineModePinboardTogglePortal } from "./inlineModePinboardToggle";
import { useLazyQuery } from "@apollo/client";
import { gqlGetItemCounts } from "../../gql";
import { PinboardIdWithItemCounts } from "shared/graphql/graphql";
import { InlineModePanel } from "./inlineModePanel";
import ReactDOM from "react-dom";
import { InlineModeWorkflowColumnHeading } from "./inlineModeWorkflowColumnHeading";
import { useGlobalStateContext } from "../globalState";

export const WORKFLOW_PINBOARD_ELEMENTS_QUERY_SELECTOR =
  ".content-list-item__field--pinboard";

export const isInlineMode = () =>
  window.location.hostname.startsWith("workflow.");

const getPinboardColumnHeadingElement = () =>
  document.querySelector(".content-list-head__heading--pinboard");
export const isPinboardColumnTurnedOn = () =>
  !!getPinboardColumnHeadingElement();

export const getWorkflowTitleElementLookup = (
  workflowPinboardElements: HTMLElement[]
) =>
  workflowPinboardElements.reduce((acc, node) => {
    const { pinboardId } = node.dataset;
    return pinboardId ? { ...acc, [pinboardId]: node } : acc;
  }, {} as Record<string, HTMLElement>);

interface InlineModeProps {
  workflowPinboardElements: HTMLElement[];
  maybeInlineSelectedPinboardId: string | null;
  setMaybeInlineSelectedPinboardId: (pinboardId: string | null) => void;
}

export const InlineMode = ({
  workflowPinboardElements,
  maybeInlineSelectedPinboardId,
  setMaybeInlineSelectedPinboardId,
}: InlineModeProps) => {
  const {
    totalItemsReceivedViaSubscription,
    totalOfMyOwnOnSeenItemsReceivedViaSubscription,
  } = useGlobalStateContext();

  const pinboardArea = useMemo(
    () => document.getElementById("pinboard-area"),
    []
  );
  const pinboardColumnHeadingElement = useMemo(
    getPinboardColumnHeadingElement,
    []
  );

  const workflowTitleElementLookup = useMemo(
    () => getWorkflowTitleElementLookup(workflowPinboardElements),
    [workflowPinboardElements]
  );

  const [itemCountsLookup, setItemCountsLookup] = useState<
    Record<string, PinboardIdWithItemCounts>
  >({});

  const [fetchItemCounts] = useLazyQuery(gqlGetItemCounts);

  useEffect(() => {
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
    }
  }, [
    workflowTitleElementLookup,
    totalItemsReceivedViaSubscription,
    totalOfMyOwnOnSeenItemsReceivedViaSubscription,
  ]);

  const maybeSelectedNode =
    maybeInlineSelectedPinboardId &&
    workflowTitleElementLookup[maybeInlineSelectedPinboardId];

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
            pinboardId={maybeInlineSelectedPinboardId}
            composerId={maybeSelectedNode.dataset.composerId || null}
            closePanel={() => setMaybeInlineSelectedPinboardId(null)}
            workingTitle={maybeSelectedNode.dataset.workingTitle || null}
            headline={maybeSelectedNode.dataset.headline || null}
            setMaybeInlineSelectedPinboardId={setMaybeInlineSelectedPinboardId}
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
            isSelected={pinboardId === maybeInlineSelectedPinboardId}
            setMaybeSelectedPinboardId={setMaybeInlineSelectedPinboardId}
          />
        )
      )}
    </React.Fragment>
  );
};
