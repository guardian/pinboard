import React, {useEffect, useState} from "react";
import {AddToPinboardButton} from "./addToPinboardButton";
import {ButtonPortal, PIN_BUTTON_HTML_TAG} from "./pinButton";

export const PinboardApp = () => {

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
        <AddToPinboardButton />
        {buttonNodes.map((node, index) =>
            <ButtonPortal key={index} node={node} />
        )}
    </>;
}

