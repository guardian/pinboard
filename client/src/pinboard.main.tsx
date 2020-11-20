import React, {useEffect, useState} from "react";
import {Widget} from "./widget";
import {ButtonPortal, PIN_BUTTON_HTML_TAG} from "./addToPinboardButton";
import { render } from "react-dom";
import { AppSyncConfig } from "../../shared/AppSyncConfig";

export function mount(appSyncConfig: AppSyncConfig) {

    const element = document.createElement("pinboard");

    document.body.appendChild(element);

    render(
      React.createElement(PinBoardApp, appSyncConfig),
      element,
    );

}

const PinBoardApp = (appSyncConfig: AppSyncConfig) => {

    const [buttonNodes, setButtonNodes] = useState<HTMLElement[]>([]);

    const refreshButtonNodes = () => setButtonNodes(
        Array.from(
            document.querySelectorAll(PIN_BUTTON_HTML_TAG)
        )
    )

    useEffect(() => {
        // Add nodes that already exist at time React app is instantiated
        refreshButtonNodes();

        // begin watching for any DOM changes
        new MutationObserver(refreshButtonNodes).observe(document.body, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false
        });

    }, []);


    return <>
        <Widget />
        {buttonNodes.map((node, index) =>
            <ButtonPortal key={index} node={node} />
        )}
    </>;
}

