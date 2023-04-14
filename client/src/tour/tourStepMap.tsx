import { Step } from "react-joyride";
import React from "react";
import Warning from "../../icons/warning.svg";
import Vector from "../../icons/vector.svg";
import { space } from "@guardian/source-foundations";
import Pencil from "../../icons/pencil.svg";
import Bin from "../../icons/bin.svg";
import root from "react-shadow/emotion";

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
      <root.div>
        The list of pinboards where:
        <ul style={{ margin: "0", paddingLeft: `${space[4]}px` }}>
          <li>You have edited the body text or furniture</li>
          <li>
            or, have been <strong>@mentioned</strong>
          </li>
        </ul>
        <p>
          You can manually hide these items from your list by selecting the{" "}
          <em>‘X’</em> icon.
        </p>
      </root.div>
    ),
    placement: "left",
  },
  teamPinboards: {
    title: "My teams' boards",
    isIndexView: true,
    spotlightClicks: false,
    content: (
      <div>
        The list of boards where any of the teams you belong to have been
        mentioned or received a request.
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
        <div style={{ marginTop: `${space[2]}px` }}>
          <Warning />
          Remember: files must be tracked on Workflow to appear on Pinboard.
        </div>
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
        Turn browser notifications on by clicking the{" "}
        <strong>‘Subscribe to desktop notifications’</strong> button
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
      <root.div>
        You can use the message field to:
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
            <strong>Send any message</strong> by typing in the box and hitting
            Enter
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
            <strong>Edit</strong> your messages by hovering on your message and
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
            <strong>Delete</strong> your messagesby hovering on your message and
            clicking <Bin />
          </li>
        </ol>
        <Vector />
        You will only be able to contact colleagues through Pinboard, if they
        have access to Composer.
      </root.div>
    ),
    placement: "left-end",
  },
  requests: {
    title: "Requests",
    isIndexView: false,
    content: (
      <div>
        To raise a request, you will need to mention a team.
        <p>
          Individuals within the team will be able to claim a request and
          confirm responsibility. This will avoid duplication of work.
          <br />
          You won’t need to know who’s on shift to make a request.
        </p>
        <p>
          <strong>Claim a request</strong> by clicking on the ‘claim’ button.
        </p>
      </div>
    ),
    placement: "left-end",
  },
  sharingGridAssets: {
    title: "Sharing assets",
    isIndexView: false,
    content: (
      <div>
        You can share{" "}
        <strong>
          original images, crops, collections, labels and searches
        </strong>{" "}
        directly from Grid.
        <p>
          Use the ‘Add to’ button to attach images or drag and drop thumbnails
          directly onto Pinboard.
        </p>
      </div>
    ),
    placement: "left-end",
  },
  assetView: {
    title: "Asset tab",
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
      <root.div>
        You can enable Pinboard through{" "}
        <strong>
          <u>Workflow</u>
        </strong>
        ’s filters panel.
        <ol style={{ paddingLeft: `${space[5]}px` }}>
          <li>Scroll all the way to the right</li>
          <li>Click on the column icon</li>
          <li>Select Pinboard</li>
          <li>
            Click the ‘reload to view changes’ button at the bottom of the
            checklist
          </li>
        </ol>
      </root.div>
    ),
    placement: "left-end",
  },
  feedback: {
    title: "Send us feedback",
    isIndexView: false,
    content: (
      <div>
        <p>Experiencing an issue or have a feature request for Pinboard?</p>
        <p>The Editorial Tools team would love to hear from you.</p>
        <p>Just drop us a message via Pinboard.</p>
      </div>
    ),
    placement: "left",
  },
} satisfies Record<string, CustomStep>;

export type TourStepID = keyof typeof _tourStepMap;

export const tourStepMap = _tourStepMap as Record<TourStepID, CustomStep>;

export const tourStepIDs = Object.keys(tourStepMap) as TourStepID[];
