import { gql, useQuery } from "@apollo/client";
import React from "react";

import { PinboardData } from "./pinboard";

interface SelectPinboardProps {
  openPinboard: (pinboardData: PinboardData) => void;
}

export const SelectPinboard = ({ openPinboard }: SelectPinboardProps) => {
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

  return (
    <div>
      {loading && <p>Loading pinboards...</p>}
      {data &&
        data.listPinboards.map((pinboard: PinboardData) => (
          <div key={pinboard.id}>
            <span
              onClick={(e) => {
                e.preventDefault();
                openPinboard(pinboard);
              }}
            >
              {pinboard.title} ({pinboard.id})
            </span>
          </div>
        ))}
    </div>
  );
};
