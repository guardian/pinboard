// TODO see if there is some nice library for syntax highlighting the string interpolation e.g. js`...`
import { ClientConfig } from "../../shared/clientConfig";

export const loaderTemplate = (
  clientConfig: ClientConfig,
  mainJsFilename: string,
  hostname: string
): string => `
  
  if(typeof PinBoard === 'undefined') { // this avoids pinboard being added to the page more than once
    const script = document.createElement('script');
    script.onload = function () {
      PinBoard.mount(${JSON.stringify(clientConfig)});
    };
    script.src = 'https://${hostname}/${mainJsFilename}';
    document.head.appendChild(script);
  }
  
`;
