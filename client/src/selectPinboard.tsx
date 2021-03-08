/** @jsx jsx */

import { ApolloError, useQuery } from "@apollo/client";
import React, { useState } from "react";
import { css, jsx } from "@emotion/react";
import { PinboardData } from "./pinboard";
import { PerPinboard, standardWidgetContainerCss } from "./widget";
import { PayloadDisplay } from "./payloadDisplay";
import { pinboardSecondaryPastel, pinMetal } from "../colours";
import { space } from "@guardian/src-foundations";
import { PayloadAndType } from "./types/PayloadAndType";
import { gqlListPinboards } from "../gql";

interface SelectPinboardProps {
  openPinboard: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  pinboardIds: string[];
  unreadFlags: PerPinboard<boolean>;
  errors: PerPinboard<ApolloError>;
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
}

export const SelectPinboard = ({
  openPinboard,
  closePinboard,
  pinboardIds: activePinboardIds,
  unreadFlags,
  errors,
  payloadToBeSent,
  clearPayloadToBeSent,
}: SelectPinboardProps) => {
  const [searchText, setSearchText] = useState<string>("");

  const { data, loading } = useQuery(gqlListPinboards);

  // TODO: improve styling, add unread/error badges beside open pinboards

  const OpenPinboardButton = (pinboardData: PinboardData) => (
    <div
      css={css`
        display: flex;
        margin-bottom: 2px;
      `}
      key={pinboardData.id}
    >
      <button
        css={css`
          text-align: left;
          background-color: white;
          flex-grow: 1;
          color: #131212;
        `}
        onClick={() => openPinboard(pinboardData)}
      >
        {activePinboardIds.includes(pinboardData.id) &&
          unreadFlags[pinboardData.id] &&
          "🔴 "}
        {activePinboardIds.includes(pinboardData.id) &&
          errors[pinboardData.id] &&
          "⚠️ "}
        {pinboardData.title}
      </button>
      {activePinboardIds.includes(pinboardData.id) && (
        <button onClick={() => closePinboard(pinboardData.id)}>❌</button>
      )}
    </div>
  );

  return (
    <div css={standardWidgetContainerCss}>
      {payloadToBeSent && (
        <div
          css={css`
            width: 150px;
            position: absolute;
            top: ${space[5]}px;
            left: -180px;
            background-color: ${pinboardSecondaryPastel};
            padding: ${space[3]}px;
            text-align: center;
            border-radius: ${space[2]}px;
            color: ${pinMetal};
          `}
        >
          <p
            css={css`
              margin-top: 0;
            `}
          >
            Choose the pinboard for this asset 👉
          </p>

          <PayloadDisplay
            {...payloadToBeSent}
            clearPayloadToBeSent={clearPayloadToBeSent}
          />
        </div>
      )}
      {loading && <p>Loading pinboards...</p>}
      <h4>Active pinboards</h4>
      {data &&
        data.listPinboards
          .filter((pinboardData: PinboardData) =>
            activePinboardIds.includes(pinboardData.id)
          )
          .map(OpenPinboardButton)}
      <h4>Open a pinboard</h4>
      {data && (
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search for a Pinboard..."
          css={{
            marginBottom: "5px",
            boxSizing: "border-box",
            width: "100%",
          }}
        />
      )}
      {data &&
        data.listPinboards
          .filter(
            (pinboardData: PinboardData) =>
              !activePinboardIds.includes(pinboardData.id) &&
              pinboardData.title
                ?.toLowerCase()
                .includes(searchText?.toLowerCase())
          )
          .map(OpenPinboardButton)}
    </div>
  );
};
