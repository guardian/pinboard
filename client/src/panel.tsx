import { ApolloError } from "@apollo/client";
import { css } from "@emotion/react";
import React, { useRef } from "react";
import { Item, User, WorkflowStub } from "../../shared/graphql/graphql";
import { pinboard } from "../colours";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import { bottom, boxShadow, floatySize, right } from "./styling";
import { PayloadAndType } from "./types/PayloadAndType";
import { PerPinboard } from "./types/PerPinboard";

export interface PanelProps {
  isExpanded: boolean;
  isNotTrackedInWorkflow: boolean;
  selectedPinboardId: string | null | undefined;
  openPinboard: (pinboardData: PinboardData) => void;
  activePinboardIds: string[];
  closePinboard: (pinboardIdToClose: string) => void;
  unreadFlags: PerPinboard<boolean>;
  errors: PerPinboard<ApolloError>;
  preselectedPinboard: WorkflowStub | undefined;
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  hasWebPushSubscription: boolean | null | undefined;
  activePinboards: PinboardData[];
  setError: (pinboardId: string, error: ApolloError | undefined) => void;
  setUnreadFlagOnPinboard: (
    pinboardId: string
  ) => (unreadFlag: boolean | undefined) => void;
  clearSelectedPinboard: () => void;
  hasError: boolean;
  hasUnread: boolean;
  userEmail: string;
  userLookup: { [email: string]: User } | undefined;
  showNotification: (item: Item) => void;
}
export const Panel: React.FC<PanelProps> = ({
  isExpanded,
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
  activePinboards,
  setError,
  setUnreadFlagOnPinboard,
  clearSelectedPinboard,
  hasError,
  hasUnread,
  userEmail,
  userLookup,
  showNotification,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
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
      ref={panelRef}
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
            panelElement={panelRef.current}
            userEmail={userEmail}
            userLookup={userLookup}
            payloadToBeSent={payloadToBeSent}
            clearPayloadToBeSent={clearPayloadToBeSent}
            showNotification={showNotification}
          />
        ))
      }
    </div>
  );
};
