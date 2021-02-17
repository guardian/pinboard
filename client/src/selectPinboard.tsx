/** @jsx jsx */

import { gql, useQuery } from "@apollo/client";
import React, { useState } from "react";
import { css, jsx } from "@emotion/react";

import { PinboardData } from "./pinboard";
import { standardWidgetContainerCss } from "./widget";

interface SelectPinboardProps {
  openPinboard: (pinboardData: PinboardData) => void;
  closePinboard: (pinboardId: string) => void;
  pinboardIds: string[];
}

export const SelectPinboard = ({
  openPinboard,
  closePinboard,
  pinboardIds,
}: SelectPinboardProps) => {
  const [searchText, setSearchText] = useState<string>("");

  const { data, loading } = useQuery(gql`
    query MyQuery {
      listPinboards {
        composerId
        id
        status
        title
      }
    }
  `);

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
        {pinboardData.title}
      </button>
      {pinboardIds.includes(pinboardData.id) && (
        <button onClick={() => closePinboard(pinboardData.id)}>❌</button>
      )}
    </div>
  );

  return (
    <div css={standardWidgetContainerCss}>
      {loading && <p>Loading pinboards...</p>}
      <h4>Active pinboards</h4>
      {data &&
        data.listPinboards
          .filter((pinboardData: PinboardData) =>
            pinboardIds.includes(pinboardData.id)
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
              !pinboardIds.includes(pinboardData.id) &&
              pinboardData.title?.includes(searchText)
          )
          .map(OpenPinboardButton)}
    </div>
  );
};
