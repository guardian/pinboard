import { useMutation } from "@apollo/client";
import { css } from "@emotion/react";
import { neutral, space } from "@guardian/source-foundations";
import { SvgStar, SvgStarOutline } from "@guardian/source-react-components";
import React from "react";
import { Item } from "shared/graphql/graphql";
import { composer } from "../../colours";
import { gqlSetIsStarred } from "../../gql";
import { useConfirmModal } from "../modal";
import { scrollbarsCss } from "../styling";

export const STARRED_CONTROL_CLASS_NAME = "starred-control";

interface StarredControlProps {
  item: Item;
}

export const StarredControl = ({
  item: { id, isStarred, message },
}: StarredControlProps) => {
  const [setIsStarred] = useMutation(gqlSetIsStarred);
  const [confirmModalElement, confirm] = useConfirmModal(
    <React.Fragment>
      <div>
        Are you sure you want
        <br /> to <strong>{isStarred ? "unstar" : "star"}</strong> this item?
      </div>
      <div
        css={css`
          padding: ${space[2]}px;
          font-style: italic;
          max-height: 55px;
          overflow-y: auto;
          ${scrollbarsCss(composer.primary["100"])}
        `}
      >
        {message}
      </div>
    </React.Fragment>
  );
  const toggleIsStarred = () => {
    confirm().then((isConfirmed) => {
      isConfirmed &&
        setIsStarred({ variables: { itemId: id, isStarred: !isStarred } });
    });
  };
  return (
    <div>
      {confirmModalElement}
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
    </div>
  );
};
