import { Step } from "react-joyride";
import React from "react";
import EditIcon from "../../icons/pencil.svg";
import BinIcon from "../../icons/bin.svg";
import { PendingItem } from "../types/PendingItem";
import { LineBreak } from "./toolTip";
import { space } from "@guardian/source-foundations";

type CustomStep = Omit<Step, "target"> & {
  isIndexView: boolean;
  shouldPreventNext?: (sends: PendingItem[]) => boolean;
};

const _tourStepMap = {
  myPinboards: {
    title: "My Pinboards",
    isIndexView: true,
    spotlightClicks: false,
    content: (
      <div>
        The list of pinboards where:
        <ul>
          <li>you are active on</li>
          <li>have been sent a message</li>
          <li>or have been mentioned in</li>
        </ul>
        <LineBreak />
        You can manually hide them by clicking on the x icon.
      </div>
    ),
    placement: "left",
  },
  teamPinboards: {
    title: "My teams' Pinboards",
    isIndexView: true,
    spotlightClicks: false,
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
        You can search for Pinboards using this searchbar.
        <LineBreak />
        Remember files need to be tracked on Workflow to have a Pinboard!
      </div>
    ),
    placement: "left",
  },
  notificationSetting: {
    title: "Desktop Notifications",
    spotlightClicks: false,
    isIndexView: true,
    content: (
      <div>
        Turn browser notifications on and off by clicking the subscribe button
        <LineBreak />
        You will get notifications on the icon regardless.
      </div>
    ),
    placement: "left",
  },
  basicMessage: {
    title: "Messaging",
    isIndexView: false,
    shouldPreventNext: (successfulSends: PendingItem[]) =>
      successfulSends.length === 0,
    content: (
      <div>
        You can use this space to message colleagues with Composer permissions.
        <ul
          style={{ marginTop: `${space[2]}px`, paddingLeft: `${space[4]}px` }}
        >
          <li style={{ margin: `${space[2]}px 0` }}>
            <b>Mention</b> them directly by using @name.surname
          </li>
          <li style={{ margin: `${space[2]}px 0` }}>
            You can also <b>mention a team</b> if you’re unsure who’s on shift.
          </li>
          <li style={{ margin: `${space[2]}px 0` }}>
            You can <b>edit and delete</b> your messages by clicking on the
            icons
          </li>
          <div>
            <div
              style={{
                display: "flex",
                border: "1px solid lightGrey",
                width: "36px",
                justifyContent: "space-between",
                padding: "6px",
                position: "relative",
                background: "white",
                marginLeft: "140px",
                borderRadius: "40px",
              }}
            >
              <EditIcon />
              <BinIcon />
            </div>
            <div
              style={{
                backgroundColor: "#ECECEC",
                width: "70%",
                marginTop: "-20px",
              }}
            >
              <p
                style={{ color: "grey", margin: 0, fontSize: `${space[2]}px` }}
              >
                13:08
              </p>
              <p style={{ margin: 0 }}>Example message</p>
            </div>
          </div>
        </ul>
        <LineBreak />
        Remember all Pinboard content is public and will be visible to everyone
        with access to Composer
      </div>
    ), // TODO finish this
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
    content: (
      <div>
        Does something not work as expected? Do you have any feature requests
        for Pinboard? Send a note to the Editorial Tools team directly from
        Pinboard
      </div>
    ),
    placement: "left",
  },
} satisfies Record<string, CustomStep>;

export type TourStepID = keyof typeof _tourStepMap;

export const tourStepMap = _tourStepMap as Record<TourStepID, CustomStep>;

export const tourStepIDs = Object.keys(tourStepMap) as TourStepID[];
