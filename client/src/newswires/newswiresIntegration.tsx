import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "../util";
import React from "react";
import { css, Global } from "@emotion/react";
import { useGlobalStateContext } from "../globalState";
import { pinboard, pinMetal } from "../../colours";
import { textSans } from "../../fontNormaliser";
import { space } from "@guardian/source-foundations";
import ReactDOM from "react-dom";
import PinIcon from "../../icons/pin-icon.svg";
import root from "react-shadow/emotion";
import { boxShadow } from "../styling";

const SELECTION_TARGET_DATA_ATTR = "[data-pinboard-selection-target]";

interface ButtonPosition {
  top: number;
  left: number;
}

export const NewswiresIntegration = () => {
  const { setPayloadToBeSent, setIsExpanded } = useGlobalStateContext();

  const [state, setState] = useState<{
    selectedHTML: string;
    mountPoint: HTMLElement;
    firstButtonPosition: ButtonPosition;
    lastButtonPosition: ButtonPosition;
  } | null>(null);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    const maybeOriginalTargetEl: HTMLElement | null = document.querySelector(
      SELECTION_TARGET_DATA_ATTR
    );
    if (
      selection &&
      selection.rangeCount > 0 &&
      selection.toString().length > 0 &&
      maybeOriginalTargetEl
    ) {
      const clonedContents = selection.getRangeAt(0).cloneContents();
      const maybeClonedTargetEl = clonedContents.querySelector(
        SELECTION_TARGET_DATA_ATTR
      );
      const parentRect = maybeOriginalTargetEl.getBoundingClientRect();
      const selectionRects = Array.from(
        selection.getRangeAt(0).getClientRects()
      );
      const firstRect = selectionRects[0];
      const lastRect = selectionRects[selectionRects.length - 1];
      const newFirstButtonCoords = {
        top: firstRect.y - parentRect.y,
        left: firstRect.x - parentRect.x,
      };
      const newLastButtonCoords = {
        top: lastRect.y - parentRect.y + lastRect.height,
        left: lastRect.x - parentRect.x + lastRect.width - 1,
      };
      if (maybeClonedTargetEl) {
        console.log(
          "selection contains whole target element; contents:",
          maybeClonedTargetEl.innerHTML
        );
        setState({
          selectedHTML: maybeClonedTargetEl.innerHTML,
          mountPoint: maybeOriginalTargetEl,
          firstButtonPosition: newFirstButtonCoords,
          lastButtonPosition: newLastButtonCoords,
        });
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
        setState({
          selectedHTML: tempEl.innerHTML,
          mountPoint: maybeOriginalTargetEl,
          firstButtonPosition: newFirstButtonCoords,
          lastButtonPosition: newLastButtonCoords,
        });
        //TODO might need to clean up tempEl
      }
    }
  };

  const debouncedSelectionHandler = useMemo(
    () => () => {
      setState(null); // clear selection to hide buttons
      debounce(handleSelectionChange, 500)();
    },
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
    if (state) {
      setPayloadToBeSent({
        type: "newswires-snippet",
        payload: {
          embeddableHtml: state.selectedHTML,
          embeddableUrl: window.location.href,
        },
      });
      setIsExpanded(true);
    }
  }, [state, setPayloadToBeSent]);

  return (
    <>
      <Global
        styles={css`
          ${SELECTION_TARGET_DATA_ATTR} {
            position: relative;
          }
          ${SELECTION_TARGET_DATA_ATTR}::selection, ${SELECTION_TARGET_DATA_ATTR} ::selection {
            background-color: ${pinboard[500]};
            color: ${pinMetal};
          }
        `}
      />
      {state &&
        ReactDOM.createPortal(
          <root.div>
            {[state.firstButtonPosition, state.lastButtonPosition].map(
              (buttonCoords, index) => (
                <button
                  key={index}
                  css={css`
                    position: absolute;
                    top: ${buttonCoords.top}px;
                    left: ${buttonCoords.left}px;
                    transform: translate(
                      ${
                        buttonCoords === state.firstButtonPosition
                          ? "0, -100%"
                          : "-100%, 0"
                      }
                    );
                    display: flex;
                    align-items: center;
                    background-color: ${pinboard[500]};
                    ${textSans.xsmall({ fontWeight: "bold" })};
                    box-shadow: ${boxShadow};
                    border: none;
                    border-radius: 100px;
                    border-${
                      buttonCoords === state.firstButtonPosition
                        ? "bottom-left"
                        : "top-right"
                    }-radius: 0;
                    padding: 0 ${space[2]}px 0 ${space[3]}px;
                    line-height: 2;
                    cursor: pointer;
                    color: ${pinMetal};
                    text-wrap: nowrap;
                  `}
                  onClick={addSelectionToPinboard}
                >
                  Add selection to{" "}
                  <PinIcon
                    css={css`
                      height: 18px;
                      margin-left: ${space[1]}px;
                      path {
                        stroke: ${pinMetal};
                        stroke-width: 1px;
                      }
                    `}
                  />
                </button>
              )
            )}
          </root.div>,
          state.mountPoint
        )}
    </>
  );
};
