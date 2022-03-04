import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { css } from "@emotion/react";
import { standardPanelContainerCss } from "./styling";
import { PayloadDisplay } from "./payloadDisplay";
import { pinboardSecondaryPastel, pinMetal } from "../colours";
import { space } from "@guardian/source-foundations";
import { gqlListPinboards } from "../gql";
import { PushNotificationPreferencesOpener } from "./pushNotificationPreferences";
import { useGlobalStateContext } from "./globalState";
import { MAX_PINBOARDS_TO_DISPLAY } from "../../shared/constants";
import { PinboardData } from "../../shared/graphql/extraTypes";

export const SelectPinboard: React.FC = () => {
  const {
    activePinboards,
    activePinboardIds,
    payloadToBeSent,
    clearPayloadToBeSent,

    isExpanded,

    openPinboard,
    closePinboard,
    preselectedPinboard,

    hasWebPushSubscription,

    errors,

    unreadFlags,
  } = useGlobalStateContext();

  const [searchText, setSearchText] = useState<string>("");

  const { data, loading, stopPolling, startPolling, refetch } = useQuery<{
    listPinboards: PinboardData[];
  }>(gqlListPinboards, {
    variables: {
      searchText,
    },
    context: { debounceKey: gqlListPinboards, debounceTimeout: 500 },
  });

  useEffect(() => {
    if (isExpanded) {
      refetch();
      startPolling(5000);
    } else {
      stopPolling();
    }
  }, [isExpanded]);

  const allPinboards = [...(data?.listPinboards || [])].sort(
    (a, b) => (unreadFlags[a.id] ? -1 : unreadFlags[b.id] ? 1 : 0) // pinboards with unread to the top
  );

  const unopenedPinboards = allPinboards.filter(
    (pinboardData: PinboardData) => !activePinboardIds.includes(pinboardData.id)
  );

  const markWithSearchText = (input: string) => {
    if (!searchText) return input;
    const startIndex = input.toLowerCase().indexOf(searchText.toLowerCase());
    if (startIndex === -1) return input;
    const endIndex = startIndex + searchText.length;
    return (
      <React.Fragment>
        {input.substring(0, startIndex)}
        <mark>{input.substring(startIndex, endIndex)}</mark>
        {input.substring(endIndex)}
      </React.Fragment>
    );
  };

  const OpenPinboardButton = (pinboardData: PinboardData) => (
    <div
      key={pinboardData.id}
      css={css`
        display: flex;
        margin-bottom: 2px;
      `}
    >
      <button
        css={css`
          text-align: left;
          background-color: white;
          flex-grow: 1;
          color: #131212;
        `}
        onClick={() => openPinboard(pinboardData)}
      >
        {unreadFlags[pinboardData.id] && "🔴 "}
        {activePinboardIds.includes(pinboardData.id) &&
          errors[pinboardData.id] &&
          "⚠️ "}
        {pinboardData.title && markWithSearchText(pinboardData.title)}
      </button>
      {activePinboardIds.includes(pinboardData.id) && !preselectedPinboard && (
        <button onClick={() => closePinboard(pinboardData.id)}>❌</button>
      )}
    </div>
  );

  return (
    <>
      <div css={standardPanelContainerCss}>
        {payloadToBeSent && (
          <div
            css={css`
              width: 150px;
              position: absolute;
              top: ${space[5]}px;
              left: -180px;
              background-color: ${pinboardSecondaryPastel};
              padding: ${space[3]}px;
              text-align: center;
              border-radius: ${space[2]}px;
              color: ${pinMetal};
            `}
          >
            <p
              css={css`
                margin-top: 0;
              `}
            >
              Choose the pinboard for this asset 👉
            </p>

            <PayloadDisplay
              {...payloadToBeSent}
              clearPayloadToBeSent={clearPayloadToBeSent}
            />
          </div>
        )}
        {!hasWebPushSubscription && (
          /* TODO move this and the one at the bottom to some sort of settings menu */
          <PushNotificationPreferencesOpener
            hasWebPushSubscription={hasWebPushSubscription}
          />
        )}
        {loading && !searchText && <p>Loading pinboards...</p>}
        <h4>
          {preselectedPinboard
            ? `Pinboard associated with this piece`
            : `Active pinboards`}
        </h4>
        {activePinboards && activePinboards.map(OpenPinboardButton)}
        <h4>Open a pinboard </h4>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search for a Pinboard..."
          css={{
            marginBottom: "5px",
            boxSizing: "border-box",
            width: "100%",
          }}
        />
        {loading && searchText && <div>Searching...</div>}
        {data &&
          unopenedPinboards
            .slice(0, MAX_PINBOARDS_TO_DISPLAY)
            .map(OpenPinboardButton)}
        {unopenedPinboards.length > MAX_PINBOARDS_TO_DISPLAY && (
          <div css={{ textAlign: "center", fontStyle: "italic" }}>
            Too many results, <br />
            please {searchText ? "refine your" : "use the"} search...
          </div>
        )}
        {/* TODO thing for no results */}
        {hasWebPushSubscription && (
          /* TODO move this to some settings menu (rather than bottom of selection list) */
          <React.Fragment>
            <hr />
            <PushNotificationPreferencesOpener
              hasWebPushSubscription={hasWebPushSubscription}
            />
          </React.Fragment>
        )}
      </div>
    </>
  );
};
