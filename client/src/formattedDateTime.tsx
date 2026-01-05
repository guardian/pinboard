import React, { useContext } from "react";
import { formatDateTime } from "./util";

export const TickContext = React.createContext<number>(Date.now());

interface FormattedDateTimeProps {
  timestamp: number | string;
  isPartOfSentence?: true;
  withAgo?: true;
}

export const FormattedDateTime = ({
  timestamp,
  isPartOfSentence,
  withAgo,
}: FormattedDateTimeProps) => {
  useContext(TickContext); // this should cause re-render
  return (
    <React.Fragment>
      {formatDateTime(
        typeof timestamp === "number"
          ? timestamp
          : new Date(timestamp).valueOf(),
        isPartOfSentence,
        withAgo
      )}
    </React.Fragment>
  );
};
