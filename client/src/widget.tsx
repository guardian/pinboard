/** @jsx jsx */
import { ApolloError, useLazyQuery, useSubscription } from "@apollo/client";
import { css, jsx } from "@emotion/react";
import React, { useEffect, useState } from "react";
import { NotTrackedInWorkflow } from "./notTrackedInWorkflow";
import { pinMetal, pinboardPrimary, unread } from "../colours";
import { Pinboard, PinboardData } from "./pinboard";
import { SelectPinboard } from "./selectPinboard";
import PinIcon from "../icons/pin-icon.svg";
import { space } from "@guardian/src-foundations";
import { PayloadAndType } from "./types/PayloadAndType";
import { gqlGetPinboardByComposerId, gqlOnCreateItem } from "../gql";
import { cssReset } from "../cssReset";
import { User } from "../../shared/graphql/graphql";

const bottomRight = 10;
const widgetSize = 50;
const boxShadow =
  "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";
export const standardWidgetContainerCss = css`
  overflow-y: auto;
  margin: ${space[1]}px;
  h4 {
    color: black;
  }
`;

export type PerPinboard<T> = {
  [pinboardId: string]: T | undefined;
};
export interface WidgetProps {
  userEmail: string;
  preselectedComposerId: string | null | undefined;
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  userLookup: { [email: string]: User } | undefined;
}

export const Widget = (props: WidgetProps) => {
  const { isExpanded, setIsExpanded } = props;

  const [manuallyOpenedPinboards, setManuallyOpenedPinboards] = useState<
    PinboardData[]
  >([]);

  const [getPreselectedPinboard, preselectedPinboardQuery] = useLazyQuery(
    gqlGetPinboardByComposerId
  );
  useEffect(() => {
    props.preselectedComposerId &&
      getPreselectedPinboard({
        variables: {
          composerId: props.preselectedComposerId,
        },
      });
  }, [props.preselectedComposerId]);

  const preselectedPinboard: PinboardData | undefined =
    props.preselectedComposerId &&
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
    const composerUrl = `https://composer.code.dev-gutools.co.uk/content/${
      pinboardData.composerId || ".."
    }?pinboardComposerID=${pinboardData.composerId}`;
    if (!activePinboardIds.includes(pinboardData.id)) {
      preselectedPinboard
        ? window?.open(composerUrl, "_blank")?.focus()
        : setManuallyOpenedPinboards([
            ...manuallyOpenedPinboards,
            pinboardData,
          ]);
    }

    if (!preselectedPinboard || preselectedPinboard.id === pinboardData.id) {
      setSelectedPinboardId(pinboardData.id);
    }
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

  const hasUnread = Object.values(unreadFlags).find((unreadFlag) => unreadFlag);

  const closePinboard = (pinboardIdToClose: string) => {
    if (activePinboardIds.includes(pinboardIdToClose)) {
      setManuallyOpenedPinboards([
        ...manuallyOpenedPinboards.filter(
          (pinboard) => pinboard.id !== pinboardIdToClose
        ),
      ]);
    }
    setSelectedPinboardId(null);
    setUnreadFlag(pinboardIdToClose, undefined);
    setError(pinboardIdToClose, undefined);
  };

  useSubscription(gqlOnCreateItem(), {
    onSubscriptionData: ({ subscriptionData }) => {
      const { pinboardId, mentions } = subscriptionData.data.onCreateItem;

      const isMentioned = mentions.includes(props.userEmail); // TODO also check group membership here (once added)

      const pinboardIsOpen = isExpanded && selectedPinboardId === pinboardId;

      if (isMentioned && !pinboardIsOpen) {
        setUnreadFlag(pinboardId, true);
      }
    },
  });

  const isNotTrackedInWorkflow =
    props.preselectedComposerId &&
    !preselectedPinboard &&
    !preselectedPinboardQuery.loading;

  return (
    <div css={cssReset}>
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
          background-color: ${pinboardPrimary};
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <PinIcon
          css={css`
            position: absolute;
            top: 50%;
            left: 54%;
            transform: translate(-50%, -50%);
            height: ${widgetSize}px;
            width: ${widgetSize / 2}px;
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
              font-size: ${widgetSize / 4}px;
              bottom: -${widgetSize / 16}px;
              right: 0px;
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
              top: 0;
              right: 0;
              user-select: none;
              background-color: ${unread};
              width: ${space[3]}px;
              height: ${space[3]}px;
              border-radius: 100%;
            `}
          />
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
              payloadToBeSent={props.payloadToBeSent}
              clearPayloadToBeSent={props.clearPayloadToBeSent}
              preselectedPinboard={preselectedPinboard}
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
              clearSelectedPinboard={clearSelectedPinboard}
            />
          ))
        }
      </div>
    </div>
  );
};
