import { Step } from "react-joyride";
import React from "react";
import EditIcon from "../../icons/pencil.svg";
import BinIcon from "../../icons/bin.svg";
import { LineBreak } from "./tooltip";
import { space } from "@guardian/source-foundations";
import Pencil from "../../icons/pencil.svg";
import Bin from "../../icons/bin.svg";

interface InteractionFlags {
  hasSentBasicMessage: boolean;
  hasMentionedIndividual: boolean;
  hasMentionedTeam: boolean;
  hasEditedMessage: boolean;
  hasDeletedMessage: boolean;
}

type CustomStep = Omit<Omit<Step, "target">, "content"> & {
  isIndexView: boolean;
  shouldEnlargeSpotlight?: (interactions: InteractionFlags) => boolean;
  content:
    | React.ReactNode
    | ((interactions: InteractionFlags) => React.ReactNode);
};

const _tourStepMap = {
  myPinboards: {
    title: "My boards",
    isIndexView: true,
    spotlightClicks: false,
    content: (
      <div>
        The list of pinboards where:
        <ul>
          <li>You have edited the body text or furniture</li>
          <li>
            or, have been <strong>@mentioned</strong>
          </li>
        </ul>
        <LineBreak />
        You can manually hide these items from your list by selecting the ‘X’
        icon.
      </div>
    ),
    placement: "left",
  },
  teamPinboards: {
    title: "My teams' boards",
    isIndexView: true,
    spotlightClicks: false,
    content: (
      <div>
        This where you can see all the stories where any of the teams you belong
        to have been mentioned.
        <LineBreak />
        You will be able to see requests made to your team, both unclaimed and
        claimed.
      </div>
    ),
    placement: "left",
  },
  searchbar: {
    title: "Search",
    isIndexView: true,
    content: (
      <div>
        You can search for boards using the ‘Search’ toolbar at the bottom of
        the index.
        <LineBreak />
        Remember: files must be tracked on Workflow to appear on Pinboard
      </div>
    ),
    placement: "left",
  },
  notificationSetting: {
    title: "Manage notifications",
    spotlightClicks: false,
    isIndexView: true,
    content: (
      <div>
        Turn browser notifications on by clicking the ‘Subscribe to desktop
        notifications’ button
      </div>
    ),
    placement: "left",
  },
  messaging: {
    title: "Messaging",
    isIndexView: false,
    shouldEnlargeSpotlight: ({ hasSentBasicMessage }) => hasSentBasicMessage,
    // eslint-disable-next-line react/display-name
    content: ({
      hasSentBasicMessage,
      hasMentionedIndividual,
      hasEditedMessage,
      hasDeletedMessage,
    }) => (
      <div>
        You can use this space to message colleagues with Composer / Grid
        permissions. Please try the following:
        <ol style={{ paddingLeft: `${space[5]}px` }}>
          <li
            style={
              hasSentBasicMessage
                ? {
                    textDecoration: "line-through",
                  }
                : {}
            }
          >
            <strong>Send a basic message</strong> by typing in the box and
            hitting Enter
          </li>
          <li
            style={
              hasMentionedIndividual
                ? {
                    textDecoration: "line-through",
                  }
                : {}
            }
          >
            <strong>Mention a person</strong> directly by typing <code>@</code>{" "}
            and typing their name
          </li>
          <li
            style={
              hasEditedMessage
                ? {
                    textDecoration: "line-through",
                  }
                : {}
            }
          >
            <strong>Edit your messages</strong> by hovering on your message and
            clicking <Pencil />
          </li>
          <li
            style={
              hasDeletedMessage
                ? {
                    textDecoration: "line-through",
                  }
                : {}
            }
          >
            <strong>Delete your messages</strong> by hovering on your message
            and clicking <Bin />
          </li>
        </ol>
        <LineBreak />
        Remember all Pinboard content is public and will be visible to everyone
        with access to Composer
      </div>
    ),
    placement: "left-end",
  },
  requests: {
    title: "Requests",
    isIndexView: false,
    content: (
      <div>
        You can make requests by @mentioning a team.
        <ul>
          <li>You won’t need to know who’s on rota to ask for help</li>
          <li>
            They will be able to claim a request and confirm they are
            responsible for that work
          </li>
        </ul>
      </div>
    ),
    placement: "left-end",
  },
  sharingGridAssets: {
    title: "Sharing Grid assets",
    isIndexView: false,
    content: (
      <div>
        Share assets directly from Grid
        <ul>
          <li>Use the button under to the thumbnails</li>
          <li>Drag and drop thumbnails directly onto Pinboard</li>
        </ul>
      </div>
    ),
    placement: "left-end",
  },
  assetView: {
    title: "Asset View",
    isIndexView: false,
    content: (
      <div>View all the assets shared in a story file collated in this tab</div>
    ),
    placement: "bottom",
  },
  workflow: {
    title: "Access from Workflow",
    isIndexView: false,
    content: (
      <div>
        Enable the Worfklow Pinboard column through the Workflow filters panel
        <ul>
          <li>Select Pinboard</li>
          <li>Click reload at the bottom of the checklist</li>
        </ul>
        <LineBreak />
        This will allow you to interact with Pinboard directly from Workflow
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
