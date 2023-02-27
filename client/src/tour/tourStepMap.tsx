import { Placement } from "react-joyride";
import React from "react";

export const tourStepMap /*: Record<TourStepIDs, Omit<Step, "target">> */ = {
  // {
  //   target: useTourStepRef("panel"),
  //   placement: "left" as Placement,
  //   title: "Welcome to Pinboard 👋",
  //   content: (
  //       <div
  //           style={{
  //             textAlign: "left",
  //             marginTop: `${space[1]}px`,
  //             padding: 0,
  //           }}
  //       >
  //         The Guardian's very own discussion and asset-sharing tool developed
  //         for the editorial.
  //         <div style={{ display: "flex", alignItems: "center" }}>
  //           Let's take a tour. Follow the orange beacon.
  //           <BeaconIcon />
  //         </div>
  //       </div>
  //   ),
  //   locale: { last: "Continue" },
  //   disableBeacon: true,
  // }, // TODO - find a suitable target for the first step
  myPinboards: {
    title: "My Pinboards",
    content: (
      <div>
        Here you can find the list of Pinboards where you sent a message or are
        tagged by others.
      </div>
    ),
    placement: "left" as Placement,
  },
  teamPinboards: {
    title: "My Teams' Pinboards",
    content: (
      <div>
        These are the Pinboards where your team is tagged (in a message or a
        request).
      </div>
    ),
    placement: "left" as Placement,
  },
  searchbar: {
    title: "Search",
    content: (
      <div>
        You can search for other Pinboards on Workflow using this searchbar.
      </div>
    ),
    placement: "left" as Placement,
  },
  notificationSetting: {
    title: "Subscribe/Unsubscribe to Notifications",
    content: <div>You can set your browser notification settings here.</div>,
    placement: "left" as Placement,
  },
  messageArea: {
    title: "Sending messages",
    content: <div>Try typing messages here...</div>,
    placement: "left" as Placement,
  },
  // {
  //     target: useTourStepRef("messageArea"),
  //         title: "Tag someone",
  //     content: (
  //     <div>
  //         You can tag someone by typing their name with @. They will receive a
  //         message notification alert on their browser.
  //     </div>
  // ),
  //     placement: "left" as Placement,
  // },
  // {
  //     target: useTourStepRef("messageArea"),
  //         title: "Tag a team",
  //     content: (
  //     <div>
  //         <p>
  //             When you tag a team, everyone in the team will receive a
  //             notification (if their notification is turned on).
  //         </p>
  //         <p>
  //             You can turn a message into a &apos;request&apos;, so that the
  //             tagged team members can track the status.
  //         </p>
  //     </div>
  // ),
  //     placement: "left" as Placement,
  // },
  // {
  //     target: useTourStepRef("messageArea"),
  //         title: "Edit or delete your messages",
  //     content: (
  //     <div>
  //         You can also edit <EditIcon /> or delete <BinIcon /> a message by
  //         clicking on the corresponding icon next to your message.
  //     </div>
  // ),
  //     placement: "left" as Placement,
  // },
  // {
  //     target: useTourStepRef("messageArea"),
  //         title: "Share Grid images, collections or searches",
  //     content: (
  //     <div>
  //         You can share Grid images on Pinboard. Navigate to{" "}
  //         <a href={"https://media.test.dev-gutools.co.uk/"}>Grid</a>.
  //     </div>
  // ),
  //     placement: "left" as Placement,
  // },
} as const;

export type TourStepID = keyof typeof tourStepMap;

export const tourStepIDs = Object.keys(tourStepMap) as TourStepID[];
