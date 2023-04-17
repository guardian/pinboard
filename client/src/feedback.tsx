import React, { useContext, useState } from "react";
import { css } from "@emotion/react";
import { composer } from "../colours";
import { palette, space } from "@guardian/source-foundations";
import BugIcon from "../../client/icons/bug.svg";
import DownChevron from "../icons/chevron-down.svg";
import UpChevron from "../icons/chevron-up.svg";
import { agateSans } from "../fontNormaliser";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";
import { useTourProgress } from "./tour/tourState";

export const Feedback = () => {
  const sendTelemetryEvent = useContext(TelemetryContext);
  const [isOpen, setIsOpen] = useState(false);
  const tourProgress = useTourProgress();

  const handleTourStart = () => {
    tourProgress.start();
    sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.INTERACTIVE_TOUR, {
      tourEvent: "start_tour",
    });
  };

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        background-color: ${composer.primary[400]};
        padding: ${space[2]}px;
        border-radius: 4px;
        ${agateSans.xxsmall({ lineHeight: "regular" })};
        gap: ${space[1]}px;
        margin: ${space[1]}px;
        margin-bottom: 0;
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
        `}
      >
        <div
          css={css`
            flex-direction: row;
            display: flex;
          `}
        >
          <BugIcon
            css={css`
              display: block;
              padding-top: 2px;
            `}
          />
          <div
            css={css`
              color: white;
              a:link {
                color: white;
              }
              padding-left: ${space[1]}px;
            `}
          >
            Have any feedback?{" "}
            <a
              onClick={() =>
                sendTelemetryEvent?.(PINBOARD_TELEMETRY_TYPE.OPEN_FEEDBACK_FORM)
              }
              href={`https://docs.google.com/forms/d/e/1FAIpQLSc27Q4Mxl0SehQoUfOKbWlUp_xGKfIOasd9GUmLkAwpfqO0XA/viewform?usp=pp_url&entry.412999946=${encodeURIComponent(
                navigator.userAgent
              )}`}
              rel="noreferrer"
              target="_blank"
              css={css`
                color: inherit;
              `}
            >
              Let us know!
            </a>
          </div>
          <div
            css={css`
              margin-left: auto;
              cursor: pointer;
            `}
          >
            <div
              role="button"
              onClick={() => {
                if (!isOpen) {
                  sendTelemetryEvent?.(
                    PINBOARD_TELEMETRY_TYPE.EXPAND_FEEDBACK_DETAILS
                  );
                }
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? (
                <UpChevron
                  css={css`
                  color: ${palette.neutral[100]};
                  }
                `}
                />
              ) : (
                <DownChevron
                  css={css`
                  color: ${palette.neutral[100]};
                  }
                `}
                />
              )}
            </div>
          </div>
        </div>
        {isOpen && (
          <div
            css={css`
              white-space: pre;
              color: ${palette.neutral[100]};
              font-weight: 400;
            `}
          >
            <span>
              ...or if you need help,{" "}
              <a
                onClick={() =>
                  sendTelemetryEvent?.(
                    PINBOARD_TELEMETRY_TYPE.OPEN_FEEDBACK_CHAT
                  )
                }
                href="https://chat.google.com/room/AAAAbJdy6vM?cls=7"
                rel="noreferrer"
                target="_blank"
                css={css`
                  color: inherit;
                `}
              >
                chat to us!
              </a>
            </span>
            <hr
              css={css`
                width: 80%;
                margin-left: 0;
                border-top: 1px solid ${palette.neutral[100]};
                border-bottom: 0;
              `}
            />
            <p
              css={css`
                margin: ${space[1]}px 0;
              `}
            >
              Pinboard is currently in Beta testing
            </p>
            <p
              css={css`
                margin: ${space[1]}px 0;
              `}
            >
              {`You may experience bugs or\nperformance issues during this time`}
            </p>
            <hr
              css={css`
                width: 80%;
                margin-left: 0;
                border-top: 1px solid ${palette.neutral[100]};
                border-bottom: 0;
              `}
            />
          </div>
        )}
        {!tourProgress.isRunning && (
          <div
            css={css`
              color: white;
            `}
          >
            First time on Pinboard? Start{" "}
            <span
              role="button"
              css={css`
                text-decoration: underline;
                cursor: pointer;
              `}
              onClick={handleTourStart}
            >
              Guided Tour
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
