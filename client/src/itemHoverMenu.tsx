import { css } from "@emotion/react";
import React, { useContext, useEffect } from "react";
import { palette, space } from "@guardian/source-foundations";
import PencilIcon from "../icons/pencil.svg";
import BinIcon from "../icons/bin.svg";
import { useConfirmModal } from "./modal";
import { scrollbarsCss } from "./styling";
import { composer } from "../colours";
import { useMutation } from "@apollo/client";
import { gqlDeleteItem } from "../gql";
import { Item } from "../../shared/graphql/graphql";
import { PINBOARD_TELEMETRY_TYPE, TelemetryContext } from "./types/Telemetry";

export const ITEM_HOVER_MENU_CLASS_NAME = "item-hover-menu";

interface ItemHoverMenuProps {
  item: Item;
  enterEditMode: () => void;
  setMaybeDeleteItemModalElement: (element: JSX.Element | null) => void;
}

export const ItemHoverMenu = ({
  item,
  enterEditMode,
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

  useEffect(
    () => setMaybeDeleteItemModalElement(deleteConfirmModalElement),
    [deleteConfirmModalElement]
  );

  const [deleteItem] = useMutation(gqlDeleteItem, {
    onError: (error) => {
      console.error(error);
      alert(`failed to delete item`);
    },
  });

  const sendTelemetryEvent = useContext(TelemetryContext);

  const onClickDeleteItem = () => {
    confirmDelete().then((confirmed) => {
      const telemetryPayload = {
        pinboardId: item.pinboardId,
        itemId: item.id,
      };

      if (confirmed) {
        // TODO show spinner whilst deleting
        deleteItem({ variables: { itemId: item.id } });
        sendTelemetryEvent?.(
          PINBOARD_TELEMETRY_TYPE.DELETE_ITEM,
          telemetryPayload
        );
      } else {
        sendTelemetryEvent?.(
          PINBOARD_TELEMETRY_TYPE.CANCEL_DELETE_ITEM,
          telemetryPayload
        );
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
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          line-height: 11px;
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          padding: ${space[1] / 2}px;
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
      <button onClick={enterEditMode}>
        <PencilIcon />
      </button>
      <button onClick={onClickDeleteItem} css={css``}>
        <BinIcon />
      </button>
    </div>
  );
};
