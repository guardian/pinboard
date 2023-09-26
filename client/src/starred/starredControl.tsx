import { useMutation } from "@apollo/client";
import { css } from "@emotion/react";
import { neutral } from "@guardian/source-foundations";
import { SvgStar, SvgStarOutline } from "@guardian/source-react-components";
import React from "react";
import { gqlSetIsStarred } from "../../gql";

export const STARRED_CONTROL_CLASS_NAME = "starred-control";

interface StarredControlProps {
  itemId: string;
  isStarred: boolean;
}

export const StarredControl = ({ itemId, isStarred }: StarredControlProps) => {
  const [setIsStarred] = useMutation(gqlSetIsStarred);
  const toggleIsStarred = () => {
    //TODO consider modal here to confirm (in both directions)
    setIsStarred({ variables: { itemId, isStarred: !isStarred } });
  };
  return (
    <button
      onClick={toggleIsStarred}
      title={isStarred ? "Unstar" : "Star"}
      className={STARRED_CONTROL_CLASS_NAME}
      css={css`
        // :hover in ItemDisplay controls display
        border-radius: 50%;
        border: none;
        width: 24px;
        height: 24px;
        padding: 2px;
        cursor: pointer;
        &:hover {
          background-color: ${neutral[86]};
        }
      `}
    >
      {isStarred ? <SvgStar /> : <SvgStarOutline />}
    </button>
  );
};
