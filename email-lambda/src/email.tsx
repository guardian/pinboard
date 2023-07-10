import React from "react";
import {
  EXPAND_PINBOARD_QUERY_PARAM,
  OPEN_PINBOARD_QUERY_PARAM,
  PINBOARD_ITEM_ID_QUERY_PARAM,
} from "shared/constants";
import { STAGE } from "shared/awsIntegration";
import { pinboard, pinMetal } from "client/colours";
import { renderToString } from "preact-render-to-string";

interface ItemFragment {
  id: string;
  type: string;
  timestamp: Date;
  message: string | null;
  thumbnailURL: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
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

const AVATAR_SIZE = 25;
const AVATAR_GAP = 3;

const linkColour = "#007ABC"; // composer.primary.300

export const getBasicMessage = (isGroupMentionEmail: boolean) =>
  isGroupMentionEmail ? "" : "You might have missed...";

export const buildEmailHTML = (
  perPersonDetails: PerPersonDetails,
  isGroupMentionEmail: boolean
) =>
  renderToString(
    <div
      style={{
        color: pinMetal,
        fontFamily: "'Roboto', sans-serif",
        fontSize: "15px",
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>
        {getBasicMessage(isGroupMentionEmail)}
      </h2>
      {Object.entries(perPersonDetails).map(
        ([pinboardId, { headline, workingTitle, items }]) => (
          <div
            key={pinboardId}
            style={{
              backgroundColor: "#F6F6F6", // palette.neutral[97]
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                borderTop: `3px solid ${pinboard["500"]} `,
                padding: "2px 4px",
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
            <ul style={{ padding: "0 10px", listStyle: "none" }}>
              {items.map(
                (
                  {
                    id,
                    firstName,
                    lastName,
                    avatarUrl,
                    type,
                    message,
                    thumbnailURL,
                  },
                  index
                ) => (
                  <li
                    key={id}
                    style={{
                      padding: "4px 0 12px",
                      borderTop: index > 0 ? "1px solid #DCDCDC" : undefined,
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      {avatarUrl && (
                        <img
                          src={avatarUrl}
                          style={{
                            width: `${AVATAR_SIZE}px`,
                            height: `${AVATAR_SIZE}px`,
                            border: "1px solid #DCDCDC", // unfortunately box-shadow appears not be supported in email
                            borderRadius: "50%",
                          }}
                        />
                      )}
                      <span
                        style={{
                          lineHeight: `${AVATAR_SIZE}px`,
                          fontWeight: "bold",
                          marginLeft: avatarUrl
                            ? `${AVATAR_GAP}px`
                            : `${AVATAR_SIZE + AVATAR_GAP + 2}px`,
                        }}
                      >
                        {firstName} {lastName}
                      </span>
                    </div>
                    <div
                      style={{
                        marginLeft: `${AVATAR_SIZE + AVATAR_GAP + 2}px`,
                      }}
                    >
                      {message}
                      {type === "claim" && <em>...claimed the request</em>}
                      {thumbnailURL && (
                        <img
                          style={{
                            display: "block",
                            maxWidth: "200px",
                            maxHeight: "100px",
                            padding: "3px",
                            border: "1px solid #DCDCDC",
                            borderRadius: "4px",
                            backgroundColor: "#FFFFFF",
                          }}
                          src={thumbnailURL}
                        />
                      )}
                      <div
                        style={{
                          color: linkColour,
                        }}
                      >
                        Open message in{" "}
                        <a
                          style={{
                            color: linkColour,
                          }}
                          href={`https://workflow.${toolsDomain}/redirect/${pinboardId}?${EXPAND_PINBOARD_QUERY_PARAM}=true&${PINBOARD_ITEM_ID_QUERY_PARAM}=${id}`}
                        >
                          Composer
                        </a>
                        {", "}
                        <a
                          style={{
                            color: linkColour,
                          }}
                          href={`https://video.${toolsDomain}/videos?${OPEN_PINBOARD_QUERY_PARAM}=${pinboardId}&${PINBOARD_ITEM_ID_QUERY_PARAM}=${id}`}
                        >
                          Video
                        </a>
                        {" or "}
                        <a
                          style={{
                            color: linkColour,
                          }}
                          href={`https://media.${toolsDomain}/search?${OPEN_PINBOARD_QUERY_PARAM}=${pinboardId}&${PINBOARD_ITEM_ID_QUERY_PARAM}=${id}`.replace(
                            ".code.",
                            ".test."
                          )}
                        >
                          Grid
                        </a>
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          </div>
        )
      )}
      <div style={{ fontStyle: "italic" }}>
        The working titles (WT) and headlines (HL) above were accurate at the
        time this email was sent.
      </div>
      {!isGroupMentionEmail && (
        <>
          <h3
            style={{
              borderTop: "1px solid #DCDCDC",
              margin: "18px 0 0",
              padding: "5px 0",
            }}
          >
            Why am I getting this email?
          </h3>
          <div>A colleague mentioned you in Pinboard more than 1 hour ago.</div>
        </>
      )}
    </div>
  );
