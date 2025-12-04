import React from "react";
import { MyUser } from "shared/graphql/graphql";

interface MaybeInvalidPushNotificationPopupProps {
    me: MyUser | undefined;
}

export const MaybeInvalidPushNotificationPopup = ({me}: MaybeInvalidPushNotificationPopupProps) => {
    const shouldShowPopup = me?.hasWebPushSubscription && !me?.isValidWebPushSubscription;

    if (!shouldShowPopup) {
        return null;
    }

    // TODO: Display as a toast popup with action to re-subscribe
    // TODO: Make Pinboard iframe visible and nest inside
    return <div>You desperately need to update your push notification subscription.</div>
};