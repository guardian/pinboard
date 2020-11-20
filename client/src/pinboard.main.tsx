import React, {useEffect, useState} from "react";
import {Widget} from "./widget";
import {ButtonPortal, PIN_BUTTON_HTML_TAG} from "./addToPinboardButton";
import { render } from "react-dom";
import { AppSyncConfig } from "../../shared/AppSyncConfig";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloLink } from "apollo-link";
import { AWS_REGION } from "../../shared/awsRegion";
import { createAuthLink } from 'aws-appsync-auth-link';
import { createSubscriptionHandshakeLink } from 'aws-appsync-subscription-link';

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

        const link = ApolloLink.from([
            createAuthLink({
            url: appSyncConfig.graphqlEndpoint,
            region: AWS_REGION,
            auth: { type: 'API_KEY', apiKey: appSyncConfig.apiKey },
            }) as any,
            createSubscriptionHandshakeLink(appSyncConfig.realtimeEndpoint),
        ]);

        const client = new ApolloClient({
            link: link as any,
            cache: new InMemoryCache() as any,
        }) as any;

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

