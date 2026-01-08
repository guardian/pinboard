import { css } from "@emotion/react";
import React from "react";
import { MyUser } from "shared/graphql/graphql";

interface MaybeInvalidPushNotificationPopupProps {
    me: MyUser | undefined;
}

export const MaybeInvalidPushNotificationPopup = ({me}: MaybeInvalidPushNotificationPopupProps) => {
    const shouldShowPopup = me?.hasWebPushSubscription && !me?.isValidWebPushSubscription;

    // if (!shouldShowPopup) {
    //     return null;
    // }

    // TODO: Display as a toast popup with action to re-subscribe
    // TODO: Make Pinboard iframe visible and nest inside (refactor popout to 
    // only request notifications permission, then self-close. Else we can stay in the iframe)
    return <div css={css`
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ffcc00;
        padding: 10px 20px;
        border-radius: 0 0 5px 5px;
    `}>You desperately need to update your push notification subscription.</div>
};