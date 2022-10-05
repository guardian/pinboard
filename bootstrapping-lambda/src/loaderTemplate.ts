// TODO see if there is some nice library for syntax highlighting the string interpolation e.g. js`...`
import { ClientConfig } from "../../shared/clientConfig";
import { STAGE } from "../../shared/awsIntegration";

export const loaderTemplate = (
  clientConfig: ClientConfig,
  mainJsFilename: string,
  hostname: string
): string => `
  
  if(typeof PinBoard === 'undefined') { // this avoids pinboard being added to the page more than once
    const script = document.createElement('script');
    script.onload = function () {
        ${
          STAGE === "PROD"
            ? "console.log('Pinboard PROD load testing (Phase 3)');"
            : `PinBoard.mount(${JSON.stringify(clientConfig)});`
        }
    };
    script.src = 'https://${hostname}/${mainJsFilename}';
    document.head.appendChild(script);
  }
  
`;
