import React, { useContext } from "react";
import { formatDateTime } from "./util";

export const TickContext = React.createContext<number>(Date.now());

interface FormattedDateTimeProps {
  timestamp: number;
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
      {formatDateTime(timestamp, isPartOfSentence, withAgo)}
    </React.Fragment>
  );
};
