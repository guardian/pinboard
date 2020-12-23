import React, { useEffect, useState } from "react";
import { User } from "../../shared/User";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { ApolloError, gql, useQuery } from "@apollo/client";

const bottomRight = 10;
const widgetSize = 50;
const boxShadow =
  "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
export interface WidgetProps {
  user: User;
  preselectedComposerId: string | undefined;
}

export const Widget = (props: WidgetProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [manuallyOpenedPinboards, setManuallyOpenedPinboards] = useState<
    PinboardData[]
  >([]);

  const preselectedPinboard: PinboardData | undefined = useQuery(gql`
      query MyQuery {
        getPinboardByComposerId(composerId: "${props.preselectedComposerId}")
        {    
          title
          status
          id
          composerId
        }
      }`).data?.getPinboardByComposerId;

  const pinboards: PinboardData[] = preselectedPinboard
    ? [preselectedPinboard, ...manuallyOpenedPinboards]
    : manuallyOpenedPinboards;

  const pinboardIds = pinboards.map((_) => _.id);

  const [selectedPinboardId, setSelectedPinboardId] = useState<string | null>();

  useEffect(() => setSelectedPinboardId(preselectedPinboard?.id), [
    preselectedPinboard,
  ]);

  const clearSelectedPinboard = () => setSelectedPinboardId(null);

  const openPinboard = (pinboardData: PinboardData) => {
    if (!pinboardIds.includes(pinboardData.id)) {
      setManuallyOpenedPinboards([...manuallyOpenedPinboards, pinboardData]);
    }

    setSelectedPinboardId(pinboardData.id);
  };

  const [errors, setErrors] = useState<{
    [pinboardId: string]: ApolloError | undefined;
  }>({});

  const setError = (pinboardId: string, error: ApolloError | undefined) =>
    setErrors({ ...errors, [pinboardId]: error });

  const hasError = Object.entries(errors).find(
    ([pinboardId, error]) => pinboardIds.includes(pinboardId) && error
  );

  const [unreadFlags, setUnreadFlags] = useState<{
    [pinboardId: string]: boolean | undefined;
  }>({});

  const setUnreadFlag = (pinboardId: string, unreadFlag: boolean | undefined) =>
    setUnreadFlags({ ...unreadFlags, [pinboardId]: unreadFlag });

  const hasUnread = Object.entries(unreadFlags).find(
    ([pinboardId, unreadFlag]) => pinboardIds.includes(pinboardId) && unreadFlag
  );

  // TODO: provide visual indicator that more than one pinboard is open and a way to toggle between pinboards

  return (
    <div>
      <div
        style={{
          position: "fixed",
          zIndex: 99999,
          bottom: `${bottomRight}px`,
          right: `${bottomRight}px`,
          width: `${widgetSize}px`,
          height: `${widgetSize}px`,
          borderRadius: `${widgetSize / 2}px`,
          cursor: "pointer",
          background: "orange",
          boxShadow,
        }}
        onClick={() => setIsExpanded((previous) => !previous)}
      >
        <div
          style={{
            position: "absolute",
            fontSize: `${widgetSize / 2}px`,
            top: `${widgetSize / 4}px`,
            left: `${widgetSize / 4}px`,
            userSelect: "none",
          }}
        >
          📌
        </div>
        {hasError && (
          <div
            style={{
              position: "absolute",
              fontSize: `${widgetSize / 3}px`,
              bottom: `-${widgetSize / 16}px`,
              right: `-${widgetSize / 16}px`,
              userSelect: "none",
              textShadow: "0 0 5px black",
            }}
          >
            ⚠️
          </div>
        )}
        {hasUnread && (
          <div
            style={{
              position: "absolute",
              fontSize: `${widgetSize / 3}px`,
              top: `-${widgetSize / 16}px`,
              userSelect: "none",
            }}
          >
            🔴
          </div>
        )}
      </div>
      <div
        style={{
          position: "fixed",
          zIndex: 99998,
          background: "white",
          boxShadow,
          border: "2px orange solid",
          width: "250px",
          height: "calc(100vh - 100px)",
          bottom: `${bottomRight + widgetSize / 2 - 5}px`,
          right: `${bottomRight + widgetSize / 2 - 5}px`,
          display: isExpanded ? "flex" : "none",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        {!selectedPinboardId && (
          <SelectPinboard
            openPinboard={openPinboard}
            pinboardIds={pinboardIds}
          />
        )}
        {pinboards.map((pinboardData) => (
          <Pinboard
            {...props}
            pinboardData={pinboardData}
            key={pinboardData.id}
            setError={setError}
            setUnreadFlag={setUnreadFlag}
            isExpanded={pinboardData.id === selectedPinboardId && isExpanded}
            isSelected={pinboardData.id === selectedPinboardId}
            clearSelectedPinboard={clearSelectedPinboard}
          />
        ))}
      </div>
    </div>
  );
};
