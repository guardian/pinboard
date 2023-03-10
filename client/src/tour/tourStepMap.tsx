import { Placement } from "react-joyride";
import React from "react";

export const tourStepMap /*: Record<TourStepIDs, Omit<Step, "target">> */ = {
  myPinboards: {
    title: "My Pinboards",
    isIndexView: true,
    content: (
      <div>
        The list of pinboards you are active on or where you have been sent a
        message or mentioned by someone.
      </div>
    ),
    placement: "left" as Placement,
  },
  teamPinboards: {
    title: "My teams' Pinboards",
    isIndexView: true,
    content: (
      <div>
        These are the Pinboards where your team is tagged (in a message or a
        request).
      </div>
    ),
    placement: "left" as Placement,
  },
  searchbar: {
    title: "Search for a Pinboard",
    isIndexView: true,
    content: (
      <div>
        You can search for other Pinboards on Workflow using this searchbar.
      </div>
    ),
    placement: "left" as Placement,
  },
  notificationSetting: {
    title: "Desktop Notifications",
    isIndexView: true,
    content: <div>You can set your browser notification settings here.</div>,
    placement: "left" as Placement,
  },
  messageArea: {
    title: "Sending messages",
    isIndexView: false,
    content: <div>Try typing messages here...</div>,
    placement: "left" as Placement,
  },
  feedback: {
    title: "Send us feedback",
    isIndexView: false,
    content: <div>Send us any feedback</div>,
    placement: "left" as Placement,
  },
  // messageArea:{
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
