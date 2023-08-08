import React from "react";
import ReactDOM from "react-dom";

export const STARRED_MESSAGES_HTML_TAG = "pinboard-starred-messages";

interface StarredMessagesProps {

}

const StarredMessages = (props: StarredMessagesProps) => <div>
    <p>Starred Messages</p>
</div>;

interface StarredMessagesPortalProps {
    node: Element;
}

export const StarredMessagesPortal = ({
    node
}: StarredMessagesPortalProps) => ReactDOM.createPortal(
    <StarredMessages />,
    node
);