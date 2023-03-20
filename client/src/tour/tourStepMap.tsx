import { Placement, Step } from "react-joyride";
import React from "react";
import EditIcon from "../../icons/pencil.svg";
import BinIcon from "../../icons/bin.svg";

export const tourStepMap /*: Record<
  string,
  Omit<Step, "target"> & { isIndexView: boolean }
> */ = {
  myPinboards: {
    title: "My Pinboards",
    isIndexView: true,
    content: (
      <div>
        The list of pinboards you are active on or where you have been sent a
        message or mentioned by someone.
      </div>
    ),
    placement: "left",
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
    placement: "left",
  },
  searchbar: {
    title: "Search for a Pinboard",
    isIndexView: true,
    content: (
      <div>
        You can search for other Pinboards on Workflow using this searchbar.
      </div>
    ),
    placement: "left",
  },
  notificationSetting: {
    title: "Desktop Notifications",
    isIndexView: true,
    content: <div>You can set your browser notification settings here.</div>,
    placement: "left",
  },
  basicMessage: {
    title: "Basic messages",
    isIndexView: false,
    content: <div>send basic message</div>, // TODO finish this
    placement: "left-end",
  },
  individualMentions: {
    title: "Mentioning individuals",
    isIndexView: false,
    content: (
      <div>
        Mention a colleague by typing an @ followed by their name. This will add
        the pinboard to their list of pinboards (and they should get a desktop
        notification if they have switched them on).
      </div>
    ),
    placement: "left-end",
  },
  groupMentionsAndRequests: {
    title: "Mentioning groups/teams and requests",
    isIndexView: false,
    content: (
      <div>
        You can mention a team (with @) and turn your message into a request.
        All team members will receive a desktop notification and track whether
        the request has been completed.
      </div>
    ),
    placement: "left-end",
  },
  editAndDelete: {
    title: "Editing and deleting messages",
    isIndexView: false,
    content: (
      <div>
        You can edit <EditIcon /> or delete <BinIcon /> a message by clicking on
        the corresponding icon next to your message.
      </div>
    ),
    placement: "left-end",
  },
  feedback: {
    title: "Send us feedback",
    isIndexView: false,
    content: <div>Send us any feedback</div>,
    placement: "left",
  },
} as const;

export type TourStepID = keyof typeof tourStepMap;

export const tourStepIDs = Object.keys(tourStepMap) as TourStepID[];
