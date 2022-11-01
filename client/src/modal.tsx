import React, { ReactElement, useLayoutEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import { composer } from "../colours";
import { palette, space } from "@guardian/source-foundations";
import { agateSans } from "../fontNormaliser";

const buttonStyle = css`
  outline: none;
  cursor: pointer;
  ${agateSans.small({ lineHeight: "tight" })};
  border-radius: ${space[1]}px;
  flex-grow: 1;
  border: 1px solid white;
  background-color: transparent;
  color: white;
  &:focus-visible {
    background-color: ${composer.primary[400]};
  }
  &:hover {
    background-color: ${composer.primary[100]};
  }
`; // TODO different hover state (ask Ana)

export const useConfirmModal = (
  content: ReactElement
): [JSX.Element | null, (precondition?: boolean) => Promise<boolean>] => {
  const [promiseResolveFn, setPromiseResolveFn] = useState<
    ((value: boolean) => void) | null
  >(null);

  const yesButtonRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  useLayoutEffect(() => {
    if (promiseResolveFn) {
      yesButtonRef.current?.focus();
    }
  }, [promiseResolveFn]);

  const maybeElement = promiseResolveFn && (
    <React.Fragment>
      <div
        css={css`
          background-color: ${palette.neutral["46"]};
          position: fixed;
          bottom: 0;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          opacity: 0.5;
        `}
      />
      <div
        css={css`
          position: absolute;
          left: ${space[2]}px;
          right: ${space[2]}px;
          bottom: 30px;
          background-color: ${composer.primary["300"]};
          color: white;
          padding: ${space[2]}px;
          ${agateSans.small({ lineHeight: "tight" })};
          border-radius: ${space[2]}px;
          z-index: 9999;
        `}
      >
        {content}
        <div
          css={css`
            display: flex;
            gap: ${space[2]}px;
            margin-top: ${space[2]}px;
          `}
        >
          <button
            ref={yesButtonRef}
            css={buttonStyle}
            onClick={() => {
              promiseResolveFn(true);
              setPromiseResolveFn(null);
            }}
            tabIndex={0}
          >
            Yes
          </button>
          <button
            css={buttonStyle}
            onClick={() => {
              promiseResolveFn(false);
              setPromiseResolveFn(null);
            }}
            tabIndex={0}
          >
            No
          </button>
        </div>
      </div>
    </React.Fragment>
  );

  const callback = (precondition = true) => {
    if (!precondition) {
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      // must use the function overload of setState here, to avoid resolve being invoked immediately
      setPromiseResolveFn(() => resolve);
    });
  };

  return [maybeElement, callback];
};
