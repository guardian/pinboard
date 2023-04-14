import { Step } from "react-joyride";
import React from "react";
import WarningIcon from "../../icons/warning.svg";
import InfoIcon from "../../icons/info.svg";
import { space } from "@guardian/source-foundations";
import Pencil from "../../icons/pencil.svg";
import Bin from "../../icons/bin.svg";
import ClaimButtonImage from "./images/claim-button.png";
import GridButtonImage from "./images/grid-button.png";
import WorkflowColumnImage from "./images/workflow-column.png";
import WorkflowReloadButtonImage from "./images/workflow-reload.png";
import { SvgCross } from "@guardian/source-react-components";
import { css } from "@emotion/react";

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
    title: "My pinboards",
    isIndexView: true,
    spotlightClicks: false,
    content: (
      <div>
        The list of pinboards:
        <ul
          css={css`
            margin: "0";
            padding-left: ${space[4]}px;
          `}
        >
          <li>which you have opened or sent messages in</li>
          <li>
            or, have been <strong>@mentioned</strong>
          </li>
        </ul>
        <p>
          You can manually hide these items from your list by selecting the{" "}
          <span
            css={css`
              position: relative;
              top: ${space[1]}px;
            `}
          >
            <SvgCross size="xsmall" />
          </span>{" "}
          icon.
        </p>
      </div>
    ),
    placement: "left",
  },
  teamPinboards: {
    title: "My teams' pinboards",
    isIndexView: true,
    spotlightClicks: false,
    content: (
      <div>
        The list of boards where any of the teams you belong to have been
        mentioned or received a request.
        <p>
          You can learn more about team requests in the &apos;Requests&apos;
          step of this tour.
        </p>
      </div>
    ),
    placement: "left",
  },
  searchbar: {
    title: "Search",
    isIndexView: true,
    content: (
      <div>
        You can search for boards using the ‘Search’ box. It matches on working
        title (WT) and headline (HL), highlighting accordingly.
        <div
          css={css`
            margin-top: ${space[2]}px;
          `}
        >
          <WarningIcon viewBox="2 -3 16 13" />
          Remember: Composer pieces must be tracked in Workflow to appear in
          Pinboard.
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
        Turn on desktop notifications by clicking the{" "}
        <strong>‘Subscribe to desktop notifications’</strong> button
      </div>
    ),
    placement: "left-end",
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
        <ol
          css={css`
            padding-left: ${space[5]}px;
          `}
        >
          <li
            css={
              hasSentBasicMessage
                ? css`
                    text-decoration: line-through;
                  `
                : {}
            }
          >
            <strong>Send any message</strong> by typing in the box and hitting
            Enter
          </li>
          <li
            css={
              hasMentionedIndividual
                ? css`
                    text-decoration: line-through;
                  `
                : {}
            }
          >
            <strong>Mention a person</strong> directly by typing <code>@</code>{" "}
            and typing their name
          </li>
          <li
            css={
              hasEditedMessage
                ? css`
                    text-decoration: line-through;
                  `
                : {}
            }
          >
            <strong>Edit</strong> your messages by hovering on your message and
            clicking <Pencil />
          </li>
          <li
            css={
              hasDeletedMessage
                ? css`
                    text-decoration: line-through;
                  `
                : {}
            }
          >
            <strong>Delete</strong> your messagesby hovering on your message and
            clicking <Bin />
          </li>
        </ol>
        <InfoIcon
          css={css`
            margin-right: ${space[1]}px;
            margin-bottom: -2px;
          `}
        />
        You will only be able to contact colleagues who have the Pinboard
        permission (granted by Central Production).
      </div>
    ),
    placement: "left-end",
  },
  requests: {
    title: "Requests",
    isIndexView: false,
    content: (
      <div>
        <WarningIcon viewBox="2 -3 16 13" />
        <strong>
          This step of the tour is currently not interactive (i.e. just
          informational).
        </strong>
        <p>To raise a request, you will need to mention a team.</p>
        <p>
          Individuals within the team will be able to claim a request and
          confirm responsibility. This will avoid duplication of work.
          <br />
          You won’t need to know who’s on shift to make a request.
        </p>
        <div>
          <strong>Claim a request</strong> by clicking on the ‘claim’ button.
          <img src={ClaimButtonImage} alt="request claim button" />
        </div>
      </div>
    ),
    spotlightClicks: false,
    shouldEnlargeSpotlight: () => true,
    placement: "left-end",
  },
  sharingGridAssets: {
    title: "Sharing assets",
    isIndexView: false,
    content: (
      <div>
        <WarningIcon viewBox="2 -3 16 13" />
        <strong>
          This step of the tour is currently not interactive (i.e. just
          informational).
        </strong>
        <p>
          You can share{" "}
          <strong>
            original images, crops, collections, labels and searches
          </strong>{" "}
          directly from Grid.
        </p>
        <div
          css={css`
            margin-top: ${space[2]}px;
          `}
        >
          Use the ‘Add to’ button to attach images or drag and drop thumbnails
          directly onto Pinboard.
          <br />
          <img src={GridButtonImage} alt="grid add to button" />
        </div>
      </div>
    ),
    placement: "left-end",
    shouldEnlargeSpotlight: () => true,
    spotlightClicks: false,
  },
  assetView: {
    title: "Asset tab",
    isIndexView: false,
    content: (
      <div>View all the assets shared in a story file collated in this tab</div>
    ),
    spotlightClicks: false,
    placement: "bottom",
  },
  workflow: {
    title: "Access from Workflow",
    isIndexView: false,
    content: (
      <div>
        <WarningIcon viewBox="2 -3 16 13" />
        <strong>
          This step of the tour is currently not interactive (i.e. just
          informational).
        </strong>
        <p>
          In <strong>Workflow</strong>, you can enable the Pinboard column by:
        </p>
        <ol
          css={css`
            padding-left: ${space[5]}px;
          `}
        >
          <li>Scroll all the way to the right</li>
          <li>Click on the column icon</li>
          <li>
            Select Pinboard
            <img src={WorkflowColumnImage} alt="workflow column icon" />
          </li>
          <li>
            Click the ‘reload to view changes’ button at the bottom of the
            checklist
            <br />
            <img src={WorkflowReloadButtonImage} alt="workflow reload icon" />
          </li>
        </ol>
        <p>
          Once enabled, you can see Pinboard message counts for each Workflow
          item, and easily view and interact with the associated Pinboard by
          clicking the message counts.
        </p>
      </div>
    ),
    placement: "left-end",
    shouldEnlargeSpotlight: () => true,
    spotlightClicks: false,
  },
  feedback: {
    title: "Send us feedback",
    isIndexView: false,
    content: (
      <div>
        <p>Experiencing an issue or have a feature request for Pinboard?</p>
        <p>The Editorial Tools team would love to hear from you.</p>
      </div>
    ),
    placement: "left",
  },
} satisfies Record<string, CustomStep>;

export type TourStepID = keyof typeof _tourStepMap;

export const tourStepMap = _tourStepMap as Record<TourStepID, CustomStep>;

export const tourStepIDs = Object.keys(tourStepMap) as TourStepID[];
