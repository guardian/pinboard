import { gql, useQuery } from "@apollo/client";
import React from "react";

import { PinboardData } from "./pinboard";

interface SelectPinboardProps {
  openPinboard: (pinboardData: PinboardData) => void;
  pinboardIds: string[];
}

export const SelectPinboard = ({
  openPinboard,
  pinboardIds,
}: SelectPinboardProps) => {
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

  // TODO: improve styling, add unread/error badges beside open pinboards, and the ability to close a pinboard

  const OpenPinboardButton = (pinboardData: PinboardData) => (
    <div key={pinboardData.id}>
      <button onClick={() => openPinboard(pinboardData)}>
        {pinboardData.title}
      </button>
    </div>
  );

  return (
    <div
      style={{
        overflowY: "auto",
        margin: "5px",
      }}
    >
      {loading && <p>Loading pinboards...</p>}
      <h4>Open pinboards</h4>
      {data &&
        data.listPinboards
          .filter((pinboardData: PinboardData) =>
            pinboardIds.includes(pinboardData.id)
          )
          .map(OpenPinboardButton)}
      <h4>Open a pinboard</h4>
      {/* TODO: add search filter */}
      {data &&
        data.listPinboards
          .filter(
            (pinboardData: PinboardData) =>
              !pinboardIds.includes(pinboardData.id)
          )
          .map(OpenPinboardButton)}
    </div>
  );
};
