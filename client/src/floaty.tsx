import { css } from "@emotion/react";
import React, { useRef } from "react";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { pinMetal, pinboard, composer } from "../colours";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import PinIcon from "../icons/pin-icon.svg";
import { palette, space } from "@guardian/source-foundations";
import { PayloadAndType } from "./types/PayloadAndType";
import { agateSans } from "../fontNormaliser";
import { Item, User, WorkflowStub } from "../../shared/graphql/graphql";
import root from "react-shadow/emotion";
import { PerPinboard } from "./types/PerPinboard";
import { ApolloError } from "@apollo/client";

const bottom = 108;
const right = 15;
const floatySize = 40;
const boxShadow =
  "rgba(0, 0, 0, 0.14) 0px 0px 4px, rgba(0, 0, 0, 0.28) 0px 4px 8px";
export const standardFloatyContainerCss = css`
  overflow-y: auto;
  margin: ${space[1]}px;
  h4 {
    color: black;
  }
`;

interface FloatyNotificationsBubbleProps {
  presetUnreadNotificationCount: number | undefined;
}
const FloatyNotificationsBubble = ({
  presetUnreadNotificationCount,
}: FloatyNotificationsBubbleProps) => (
  <div
    css={css`
      position: absolute;
      top: -3px;
      left: 26px;
      user-select: none;
      background-color: ${composer.warning[300]};
      min-width: ${space[4]}px;
      height: ${space[4]}px;
      border-radius: 12px;
      ${agateSans.xxsmall()};
      color: ${palette.neutral[100]};
      text-align: center;
    `}
  >
    <span
      css={css`
        margin: 0 4px;
        height: 100%;
        display: inline-block;
        vertical-align: middle;
        line-height: 12px;
      `}
    >
      {presetUnreadNotificationCount || ""}
    </span>
  </div>
);

export interface FloatyProps {
  userEmail: string;
  presetUnreadNotificationCount: number | undefined;
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  userLookup: { [email: string]: User } | undefined;
  hasWebPushSubscription: boolean | null | undefined;
  showNotification: (item: Item) => void;
  clearDesktopNotificationsForPinboardId: (pinboardId: string) => void;
  hasError: boolean;
  isNotTrackedInWorkflow: boolean;
  selectedPinboardId: string | null | undefined;
  openPinboard: (pinboardData: PinboardData) => void;
  activePinboardIds: string[];
  closePinboard: (pinboardIdToClose: string) => void;
  unreadFlags: PerPinboard<boolean>;
  errors: PerPinboard<ApolloError>;
  preselectedPinboard: WorkflowStub | undefined;
  hasUnread: boolean;
  activePinboards: PinboardData[];
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  setUnreadFlagOnPinboard: (
    pinboardId: string
  ) => (unreadFlag: boolean | undefined) => void;
  clearSelectedPinboard: () => void;
}

export const Floaty = (props: FloatyProps) => {
  const {
    isExpanded,
    setIsExpanded,
    hasError,
    isNotTrackedInWorkflow,
    selectedPinboardId,
    openPinboard,
    activePinboardIds,
    closePinboard,
    unreadFlags,
    errors,
    payloadToBeSent,
    clearPayloadToBeSent,
    preselectedPinboard,
    hasWebPushSubscription,
    presetUnreadNotificationCount,
    hasUnread,
    activePinboards,
    setError,
    setUnreadFlagOnPinboard,
    clearSelectedPinboard,
  } = props;
  const floatyRef = useRef<HTMLDivElement>(null);
  return (
    <root.div
      css={css`
        ${agateSans.small()}
        color: ${pinMetal};
      `}
    >
      <div
        css={css`
          position: fixed;
          z-index: 99999;
          bottom: ${bottom}px;
          right: ${right}px;
          width: ${floatySize}px;
          height: ${floatySize}px;
          border-radius: ${floatySize / 2}px;
          cursor: pointer;
          box-shadow: ${boxShadow};
          background-color: ${pinboard[500]};

          &:hover {
            background-color: ${pinboard[800]};
          }
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <PinIcon
          css={css`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            height: 22px;
            width: 12px;
            path {
              stroke: ${pinMetal};
              stroke-width: 0.5px;
            }
          `}
        />
        {hasError && (
          <div
            css={css`
              position: absolute;
              font-size: ${floatySize / 4}px;
              bottom: -${floatySize / 16}px;
              right: 0px;
              user-select: none;
              text-shadow: 0 0 5px black;
            `}
          >
            ⚠️
          </div>
        )}
        {(presetUnreadNotificationCount !== undefined || hasUnread) && (
          <FloatyNotificationsBubble
            presetUnreadNotificationCount={presetUnreadNotificationCount}
          />
        )}
      </div>
      <div
        css={css`
          position: fixed;
          z-index: 99998;
          background: white;
          box-shadow: ${boxShadow};
          border: 2px ${pinboard[500]} solid;
          width: 250px;
          height: calc(100vh - 100px);
          bottom: ${bottom + floatySize / 2 - 5}px;
          right: ${right + floatySize / 2 - 5}px;
          display: ${isExpanded ? "flex" : "none"};
          flex-direction: column;
          justify-content: space-between;
          font-family: sans-serif;
        `}
        ref={floatyRef}
      >
        {isNotTrackedInWorkflow ? (
          <NotTrackedInWorkflow />
        ) : (
          !selectedPinboardId && (
            <SelectPinboard
              openPinboard={openPinboard}
              activePinboardIds={activePinboardIds}
              closePinboard={closePinboard}
              unreadFlags={unreadFlags}
              errors={errors}
              payloadToBeSent={payloadToBeSent}
              clearPayloadToBeSent={clearPayloadToBeSent}
              preselectedPinboard={preselectedPinboard}
              hasWebPushSubscription={hasWebPushSubscription}
            />
          )
        )}

        {
          // The active pinboards are always mounted, so that we receive new item notifications
          // Note that the pinboard hides itself based on 'isSelected' prop
          activePinboards.map((pinboardData) => (
            <Pinboard
              {...props}
              pinboardData={pinboardData}
              key={pinboardData.id}
              setError={setError}
              setUnreadFlag={setUnreadFlagOnPinboard(pinboardData.id)}
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
              clearSelectedPinboard={clearSelectedPinboard}
              floatyElement={floatyRef.current}
            />
          ))
        }
      </div>
    </root.div>
  );
};
