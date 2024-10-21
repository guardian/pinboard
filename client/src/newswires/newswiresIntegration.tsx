import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "../util";
import React from "react";
import { css } from "@emotion/react";
import { useGlobalStateContext } from "../globalState";

const SELECTION_TARGET_DATA_ATTR = "[data-pinboard-selection-target]";

export const NewswiresIntegration = () => {
  const { setPayloadToBeSent } = useGlobalStateContext();
  const [selectedHTML, setSelectedHTML] = useState<string | null>(null);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection) {
      const maybeOriginalTargetEl = document.querySelector(
        SELECTION_TARGET_DATA_ATTR
      );
      try {
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
        } else {
          if (
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
          }
        }
      } catch (e) {
        console.error("Error cloning selection contents", e);
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
    }
  }, [selectedHTML, setPayloadToBeSent]);

  return (
    <div
      css={css`
        position: fixed;
        top: 0;
        left: 0;
      `}
    >
      {selectedHTML && (
        <div>
          <button onClick={addSelectionToPinboard}>Add to pinboard</button>
        </div>
      )}
    </div>
  );
};
