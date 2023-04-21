import React from "react";
import {
  EXPAND_PINBOARD_QUERY_PARAM,
  PINBOARD_ITEM_ID_QUERY_PARAM,
} from "shared/constants";
import { STAGE } from "shared/awsIntegration";
import { pinboard, pinMetal } from "client/colours";

interface ItemFragment {
  id: string;
  timestamp: Date;
  message: string | null;
  thumbnailURL: string | null;
}

export interface PerPersonDetails {
  [pinboardId: string]: {
    headline: string | null;
    workingTitle: string;
    items: ItemFragment[];
  };
}

const toolsDomain =
  STAGE === "PROD" ? "gutools.co.uk" : "code.dev-gutools.co.uk";

export const basicMessage = "You have some missed mentions recently.";

const header = (
  <div>
    <h3>{basicMessage}</h3>
    <p style={{ fontStyle: "italic" }}>
      The working titles (WT) and headlines (HL) below were accurate at the time
      this email was sent.
    </p>
  </div>
);

export const EmailBody = (perPersonDetails: PerPersonDetails) => (
  <div style={{ color: pinMetal }}>
    {header}
    {Object.entries(perPersonDetails).map(
      ([pinboardId, { headline, workingTitle, items }]) => (
        <div
          key={pinboardId}
          style={{
            border: `1px solid ${pinboard["500"]}`,
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: pinboard["500"],
              color: "black", // pinMetal doesn't have good enough contrast when inverted in mobile dark mode
              padding: "5px",
            }}
          >
            <strong>WT:</strong> {workingTitle}
            {headline && (
              <>
                <br />
                <strong>HL:</strong> {headline}
              </>
            )}
          </div>
          <ul style={{ padding: "0 10px" }}>
            {items.map(({ id, message, thumbnailURL }) => (
              <li key={id} style={{ marginBottom: "10px" }}>
                {message}
                <a
                  href={`https://workflow.${toolsDomain}/redirect/${pinboardId}?${EXPAND_PINBOARD_QUERY_PARAM}=true&${PINBOARD_ITEM_ID_QUERY_PARAM}=${id}`}
                >
                  {thumbnailURL && (
                    <img
                      style={{
                        display: "block",
                        maxWidth: "200px",
                        maxHeight: "100px",
                      }}
                      src={thumbnailURL}
                    />
                  )}
                  <div>Jump to this message</div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )
    )}
  </div>
);
