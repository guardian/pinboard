import React from "react";
import {
  SvgChevronLeftSingle,
  SvgCross,
  SvgSpeechBubble,
} from "@guardian/source-react-components";
import Paperclip from "../../icons/paperclip.svg";
import ComposerC from "../../icons/composer-c.svg";

export const BackArrowIcon: React.FC = () => (
  <SvgChevronLeftSingle size="xsmall" />
);
export const CrossIcon: React.FC = () => <SvgCross size="small" />;
export const SpeechBubbleIcon: React.FC = () => (
  <SvgSpeechBubble size="xsmall" />
);
export const ClipIcon: React.FC = () => <Paperclip />;
export const ComposerIcon: React.FC = () => <ComposerC />;
