import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "../util";
import React from "react";
import { css, Global } from "@emotion/react";
import { useGlobalStateContext } from "../globalState";
import { pinboard, pinMetal } from "../../colours";
import { textSans } from "../../fontNormaliser";
import { space } from "@guardian/source-foundations";
import ReactDOM from "react-dom";

const SELECTION_TARGET_DATA_ATTR = "[data-pinboard-selection-target]";

export const NewswiresIntegration = () => {
  const { setPayloadToBeSent, setIsExpanded } = useGlobalStateContext();
  const [selectedHTML, setSelectedHTML] = useState<string | null>(null);
  const [mountPoint, setMountPoint] = useState<Element | null>(null);
  const [buttonCoords, setButtonCoords] = useState({ x: 0, y: 0 });

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const maybeOriginalTargetEl = document.querySelector(
        SELECTION_TARGET_DATA_ATTR
      );

      setMountPoint(maybeOriginalTargetEl);
      const clonedContents = selection.getRangeAt(0).cloneContents();
      const maybeClonedTargetEl = clonedContents.querySelector(
        SELECTION_TARGET_DATA_ATTR
      );
      if (maybeClonedTargetEl) {
        console.log(
          "selection contains whole target element; contents:",
          maybeClonedTargetEl.innerHTML
        );
        setSelectedHTML(maybeClonedTargetEl.innerHTML);
        setSelectionFocusNode(selectionFocusNode); // todo: set coords instead, based on selection
      } else if (
        maybeOriginalTargetEl?.contains(selection.anchorNode) &&
        maybeOriginalTargetEl?.contains(selection.focusNode)
      ) {
        const tempEl = document.createElement("div");
        tempEl.appendChild(clonedContents);
        console.log(
          "selection is within target element; contents:",
          tempEl.innerHTML
        );
        setSelectedHTML(tempEl.innerHTML);
        setSelectionFocusNode(selection.focusNode);
      }
    }
  };

  const debouncedSelectionHandler = useMemo(
    () => debounce(handleSelectionChange, 750),
    [handleSelectionChange]
  );

  useEffect(() => {
    document.addEventListener("selectionchange", debouncedSelectionHandler);
    /**
     * todos:
     *   [ ] limit to newswires domain
     *   [x] add selection listener -- addEventListener("selectionchange", (event) => {});
     *   [x] debounce handler
     *   [x] check parent node of selection is newswires body text el (maybe add data attribute to body text el)
     *       - (find first shared parent of anchorNode and focusNode, make sure we're not sharing bits of text outside of the target)
     *   [x] extract HTML from selection (see chat thread)
     *   [ ] render button when there's a selection
     *   [ ] do things with pinboard
     */
    return () =>
      document.removeEventListener(
        "selectionchange",
        debouncedSelectionHandler
      );
  }, []);

  const addSelectionToPinboard = useCallback(() => {
    if (selectedHTML) {
      setPayloadToBeSent({
        type: "newswires-snippet",
        payload: {
          embeddableHtml: selectedHTML,
          embeddableUrl: window.location.href,
        },
      });
      setIsExpanded(true);
    }
  }, [selectedHTML, setPayloadToBeSent]);

  return (
    <>
      <Global
        styles={css`
          ${SELECTION_TARGET_DATA_ATTR}::selection {
            background-color: ${pinboard[500]};
            color: ${pinMetal};
          }
        `}
      />
      {selectedHTML &&
        mountPoint &&
        ReactDOM.createPortal(
          <div>
            <button
              css={css`
                display: flex;
                align-items: center;
                background-color: ${pinboard[500]};
                ${textSans.xsmall()};
                border: none;
                border-radius: 100px;
                padding: 0 ${space[2]}px 0 ${space[3]}px;
                line-height: 2;
                cursor: pointer;
                color: ${pinMetal};
              `}
              onClick={addSelectionToPinboard}
            >
              Add selection to pinboard
            </button>
          </div>,
          mountPoint
        )}
    </>
  );
};
