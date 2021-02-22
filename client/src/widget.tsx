/** @jsx jsx */
import { ApolloError, gql, useQuery } from "@apollo/client";
import { css, jsx } from "@emotion/react";
import React, { useEffect, useState } from "react";

import { User } from "../../shared/User";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { pinboardPrimary } from "../colours";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import PinIconCircle from "../icons/pin-icon-circle.svg";

const bottomRight = 10;
const widgetSize = 50;
const boxShadow =
  "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
export const standardWidgetContainerCss = css`
  overflow-y: auto;
  margin: 5px;
  h4 {
    color: black;
  }
`;

export type PerPinboard<T> = {
  [pinboardId: string]: T | undefined;
};
export interface WidgetProps {
  user: User;
  preselectedComposerId: string | undefined;
}

export const Widget = (props: WidgetProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [manuallyOpenedPinboards, setManuallyOpenedPinboards] = useState<
    PinboardData[]
  >([]);

  const preselectedPinboardQuery = useQuery(gql`
  query MyQuery {
    getPinboardByComposerId(composerId: "${props.preselectedComposerId}")
    {    
      title
      status
      id
      composerId
    }
  }`);

  const preselectedPinboard: PinboardData | undefined =
    preselectedPinboardQuery.data?.getPinboardByComposerId;

  const activePinboards: PinboardData[] = preselectedPinboard
    ? [preselectedPinboard]
    : manuallyOpenedPinboards;

  const activePinboardIds = activePinboards.map((_) => _.id);

  const [selectedPinboardId, setSelectedPinboardId] = useState<string | null>();

  useEffect(() => setSelectedPinboardId(preselectedPinboard?.id), [
    preselectedPinboard,
  ]);

  const clearSelectedPinboard = () => setSelectedPinboardId(null);

  const openPinboard = (pinboardData: PinboardData) => {
    if (!activePinboardIds.includes(pinboardData.id)) {
      setManuallyOpenedPinboards([...manuallyOpenedPinboards, pinboardData]);
    }

    setSelectedPinboardId(pinboardData.id);
  };

  const closePinboard = (pinboardIdToClose: string) => {
    if (activePinboardIds.includes(pinboardIdToClose)) {
      setManuallyOpenedPinboards([
        ...manuallyOpenedPinboards.filter(
          (pinboard) => pinboard.id !== pinboardIdToClose
        ),
      ]);
    }
    setSelectedPinboardId(null);
  };

  const [errors, setErrors] = useState<PerPinboard<ApolloError>>({});

  const setError = (pinboardId: string, error: ApolloError | undefined) =>
    setErrors((prevErrors) => ({ ...prevErrors, [pinboardId]: error }));

  const hasError = Object.entries(errors).find(
    ([pinboardId, error]) => activePinboardIds.includes(pinboardId) && error
  );

  const [unreadFlags, setUnreadFlags] = useState<PerPinboard<boolean>>({});

  const setUnreadFlag = (pinboardId: string, unreadFlag: boolean | undefined) =>
    setUnreadFlags((prevUnreadFlags) => ({
      ...prevUnreadFlags,
      [pinboardId]: unreadFlag,
    }));

  const hasUnread = Object.entries(unreadFlags).find(
    ([pinboardId, unreadFlag]) =>
      activePinboardIds.includes(pinboardId) && unreadFlag
  );

  return (
    <div>
      <div
        css={css`
          position: fixed;
          z-index: 99999;
          bottom: ${bottomRight}px;
          right: ${bottomRight}px;
          width: ${widgetSize}px;
          height: ${widgetSize}px;
          border-radius: ${widgetSize / 2}px;
          cursor: pointer;
          box-shadow: ${boxShadow};
        `}
        onClick={() => setIsExpanded((previous) => !previous)}
      >
        <PinIconCircle
          css={css`
            width: ${widgetSize}px;
            height: ${widgetSize}px;
            circle {
              fill: ${pinboardPrimary};
            }
          `}
        />
        {hasError && (
          <div
            css={css`
              position: absolute;
              font-size: ${widgetSize / 3}px;
              bottom: -${widgetSize / 16}px;
              right: -${widgetSize / 16}px;
              user-select: none;
              text-shadow: 0 0 5px black;
            `}
          >
            ⚠️
          </div>
        )}
        {hasUnread && (
          <div
            css={css`
              position: absolute;
              font-size: ${widgetSize / 3}px;
              top: -${widgetSize / 16}px;
              user-select: none;
            `}
          >
            🔴
          </div>
        )}
      </div>
      <div
        css={css`
          position: fixed;
          z-index: 99998;
          background: white;
          box-shadow: ${boxShadow};
          border: 2px ${pinboardPrimary} solid;
          width: 250px;
          height: calc(100vh - 100px);
          bottom: ${bottomRight + widgetSize / 2 - 5}px;
          right: ${bottomRight + widgetSize / 2 - 5}px;
          display: ${isExpanded ? "flex" : "none"};
          flex-direction: column;
          justify-content: space-between;
          font-family: sans-serif;
        `}
      >
        {!preselectedPinboard &&
          !selectedPinboardId &&
          !props.preselectedComposerId && (
            <SelectPinboard
              openPinboard={openPinboard}
              pinboardIds={activePinboardIds}
              closePinboard={closePinboard}
              unreadFlags={unreadFlags}
              errors={errors}
            />
          )}
        {props.preselectedComposerId &&
          !preselectedPinboard &&
          !preselectedPinboardQuery.loading && <NotTrackedInWorkflow />}
        {
          // The active pinboards are always mounted, so that we receive new item notifications
          // Note that the pinboard hides itself based on 'isSelected' prop
          activePinboards.map((pinboardData) => (
            <Pinboard
              {...props}
              pinboardData={pinboardData}
              key={pinboardData.id}
              setError={setError}
              setUnreadFlag={setUnreadFlag}
              hasUnreadOnOtherPinboard={
                !!hasUnread &&
                !!Object.entries(unreadFlags).find(
                  ([pinboardId, isUnread]) =>
                    isUnread && pinboardId !== pinboardData.id
                )
              }
              hasErrorOnOtherPinboard={
                !!hasError &&
                !!Object.entries(errors).find(
                  ([pinboardId, isError]) =>
                    isError && pinboardId !== pinboardData.id
                )
              }
              isExpanded={pinboardData.id === selectedPinboardId && isExpanded}
              isSelected={pinboardData.id === selectedPinboardId}
              clearSelectedPinboard={
                preselectedPinboard ? undefined : clearSelectedPinboard
              }
            />
          ))
        }
      </div>
    </div>
  );
};
