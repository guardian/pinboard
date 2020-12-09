// TODO see if there is some nice library for syntax highlighting the string interpolation e.g. js`...`
import { AppSyncConfig } from "../../shared/AppSyncConfig";

export const loaderTemplate = (appSyncConfig: AppSyncConfig, mainJsFilename: string, hostname: string) => `
  
  if(typeof PinBoard === 'undefined') { // this avoids pinboard being added to the page more than once
    const script = document.createElement('script');
    script.onload = function () {
      PinBoard.mount(${JSON.stringify(appSyncConfig)});
    };
    script.src = 'https://${hostname}/${mainJsFilename}';
    document.head.appendChild(script);
  }
  
`;