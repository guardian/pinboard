import { css } from "@emotion/react";
import React, { useEffect } from "react";
import { palette, space } from "@guardian/source-foundations";
import Pencil from "../icons/pencil.svg";
import { useConfirmModal } from "./modal";
import { scrollbarsCss } from "./styling";
import { composer } from "../colours";
import { useMutation } from "@apollo/client";
import { gqlDeleteItem } from "../gql";
import { Item } from "../../shared/graphql/graphql";

export const ITEM_HOVER_MENU_CLASS_NAME = "item-hover-menu";

interface ItemHoverMenuProps {
  item: Item;
  setMaybeDeleteItemModalElement: (element: JSX.Element | null) => void;
}

export const ItemHoverMenu = ({
  item,
  setMaybeDeleteItemModalElement,
}: ItemHoverMenuProps) => {
  const [deleteConfirmModalElement, confirmDelete] = useConfirmModal(
    <React.Fragment>
      <div
        css={css`
          font-weight: bold;
        `}
      >
        Are you sure you want
        <br /> to delete this item?
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
        {item.message}
      </div>
    </React.Fragment>
  );

  useEffect(() => setMaybeDeleteItemModalElement(deleteConfirmModalElement), [
    deleteConfirmModalElement,
  ]);

  const [deleteItem] = useMutation(gqlDeleteItem, {
    onError: (error) => {
      console.error(error);
      alert(`failed to delete item`);
    },
  });

  const onClickDeleteItem = () => {
    confirmDelete().then((confirmed) => {
      if (confirmed) {
        // TODO show spinner whilst deleting
        deleteItem({ variables: { itemId: item.id } });
        // FIXME prevent scroll to top/bottom when modal closes
      }
    });
  };

  return (
    <div
      className={ITEM_HOVER_MENU_CLASS_NAME}
      css={css`
        display: none; // :hover in ItemDisplay sets this to 'display: flex'
        position: absolute;
        top: 0;
        right: 0;
        background: ${palette.neutral["86"]};
        border-radius: 12px;
        padding: ${space[1] / 2}px;
        gap: ${space[1] / 2}px;
        button {
          font-size: 11px;
          border: none;
          border-radius: 50%;
          padding: ${space[1] / 2}px ${space[1]}px;
          cursor: pointer;
          background: ${palette.neutral["86"]};
          &:hover {
            background: ${palette.neutral["60"]};
            svg {
              fill: ${palette.neutral[10]};
            }
          }
          svg {
            fill: ${palette.neutral[20]};
          }
        }
      `}
    >
      <button>
        <Pencil />
      </button>
      <button onClick={onClickDeleteItem}>
        🗑 {/*FIXME use SVG from Ana*/}
      </button>
    </div>
  );
};
