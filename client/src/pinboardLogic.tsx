import { useLazyQuery, ApolloError, useSubscription } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { Item, User } from "../../shared/graphql/graphql";
import { gqlGetPinboardByComposerId, gqlOnCreateItem } from "../gql";
import { EXPAND_PINBOARD_QUERY_PARAM } from "./app";
import { Floaty } from "./floaty";
import { Panel } from "./panel";
import type { PinboardData } from "./pinboard";
import type { PayloadAndType } from "./types/PayloadAndType";
import type { PerPinboard } from "./types/PerPinboard";

export interface PinboardLogicProps {
  userEmail: string;
  preselectedComposerId: string | null | undefined;
  payloadToBeSent: PayloadAndType | null;
  clearPayloadToBeSent: () => void;
  isExpanded: boolean;
  setIsExpanded: (_: boolean) => void;
  userLookup: { [email: string]: User } | undefined;
  hasWebPushSubscription: boolean | null | undefined;
  showNotification: (item: Item) => void;
  clearDesktopNotificationsForPinboardId: (pinboardId: string) => void;
  presetUnreadNotificationCount: number | undefined;
}

export const PinboardLogic: React.FC<PinboardLogicProps> = (props) => {
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
    const hostname = window.location.hostname;
    const composerDomain =
      hostname.includes(".local.") ||
      hostname.includes(".code.") ||
      hostname.includes(".test.")
        ? "code.dev-gutools.co.uk"
        : "gutools.co.uk";
    const composerUrl = `https://composer.${composerDomain}/content/${
      pinboardData.composerId || ".."
    }?${EXPAND_PINBOARD_QUERY_PARAM}=true`;
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

  const hasError =
    Object.entries(errors).find(
      ([pinboardId, error]) => activePinboardIds.includes(pinboardId) && error
    ) !== undefined;

  const [unreadFlags, setUnreadFlags] = useState<PerPinboard<boolean>>({});

  const setUnreadFlag = (pinboardId: string) => (
    unreadFlag: boolean | undefined
  ) => {
    setUnreadFlags((prevUnreadFlags) => ({
      ...prevUnreadFlags,
      [pinboardId]: unreadFlag,
    }));
    !unreadFlag && props.clearDesktopNotificationsForPinboardId(pinboardId);
  };

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
    setUnreadFlag(pinboardIdToClose)(undefined);
    setError(pinboardIdToClose, undefined);
  };

  useSubscription(gqlOnCreateItem(), {
    onSubscriptionData: ({ subscriptionData }) => {
      const { pinboardId, mentions } = subscriptionData.data.onCreateItem;

      const isMentioned = mentions.includes(props.userEmail); // TODO also check group membership here (once added)

      const pinboardIsOpen =
        props.isExpanded && selectedPinboardId === pinboardId;

      if (isMentioned && !pinboardIsOpen) {
        setUnreadFlag(pinboardId)(true);
      }
    },
  });

  const isNotTrackedInWorkflow = Boolean(
    props.preselectedComposerId &&
      !preselectedPinboard &&
      !preselectedPinboardQuery.loading
  );

  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (
        event.source !== window &&
        Object.prototype.hasOwnProperty.call(event.data, "item")
      ) {
        const item = event.data.item;
        window.focus();
        props.setIsExpanded(true);
        setSelectedPinboardId(item.pinboardId); // FIXME handle if said pinboard is not active (i.e. load data)
        // TODO ideally highlight the item
      }
    });
  }, []);

  return (
    <>
      <Floaty
        presetUnreadNotificationCount={props.presetUnreadNotificationCount}
        isExpanded={props.isExpanded}
        setIsExpanded={props.setIsExpanded}
        hasError={hasError}
        hasUnread={!!hasUnread}
      />
      <Panel
        userEmail={props.userEmail}
        payloadToBeSent={props.payloadToBeSent}
        clearPayloadToBeSent={props.clearPayloadToBeSent}
        userLookup={props.userLookup}
        hasWebPushSubscription={props.hasWebPushSubscription}
        showNotification={props.showNotification}
        isNotTrackedInWorkflow={isNotTrackedInWorkflow}
        selectedPinboardId={selectedPinboardId}
        openPinboard={openPinboard}
        activePinboardIds={activePinboardIds}
        closePinboard={closePinboard}
        unreadFlags={unreadFlags}
        errors={errors}
        preselectedPinboard={preselectedPinboard}
        activePinboards={activePinboards}
        setError={setError}
        setUnreadFlagOnPinboard={setUnreadFlag}
        clearSelectedPinboard={clearSelectedPinboard}
        isExpanded={props.isExpanded}
        hasError={hasError}
        hasUnread={!!hasUnread}
      />
    </>
  );
};
