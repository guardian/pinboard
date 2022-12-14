import { css } from "@emotion/react";
import React from "react";
import { ImagingOrderPayload } from "../types/PayloadAndType";
import {
  IMAGINE_REQUEST_TYPES,
  IMAGING_REQUEST_ITEM_TYPE,
  ImagingRequestType,
} from "../../../shared/octopusImaging";
import { agateSans } from "../../fontNormaliser";
import { useGlobalStateContext } from "../globalState";
import { space } from "@guardian/source-foundations";

interface OctopusImagingOrderDisplayProps extends ImagingOrderPayload {
  isEditable?: boolean;
}

export const OctopusImagingOrderDisplay = ({
  payload,
  isEditable,
}: OctopusImagingOrderDisplayProps) => {
  const { setPayloadToBeSent } = useGlobalStateContext();
  return (
    <div
      css={css`
        ${agateSans.xxsmall()}
      `}
    >
      <h3
        css={css`
          margin: 0 0 ${space[1]}px;
        `}
      >
        Imaging Order
      </h3>
      {isEditable && (
        <div
          css={css`
            padding-right: 25px;
          `}
        >
          <em>
            {
              "Don't forget to provide some notes to help Imaging team to understand your request"
            }
          </em>
        </div>
      )}
      <img
        src={payload.thumbnail}
        css={css`
          object-fit: contain;
          width: 100%;
          height: 100%;
        `}
        draggable={false}
        // TODO: hover for larger thumbnail
      />
      <div>
        <strong>Request Type: </strong>
        {isEditable ? (
          <select
            onClick={(e) => e.stopPropagation()}
            onChange={(event) =>
              setPayloadToBeSent({
                type: IMAGING_REQUEST_ITEM_TYPE,
                payload: {
                  ...payload,
                  requestType: event.target.value as ImagingRequestType,
                },
              })
            }
          >
            {IMAGINE_REQUEST_TYPES.map((requestType, index) => (
              <option key={index}>{requestType}</option>
            ))}
          </select>
        ) : (
          payload.requestType
        )}
      </div>
    </div>
  );
};
