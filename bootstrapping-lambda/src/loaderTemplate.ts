// TODO see if there is some nice library for syntax highlighting the string interpolation e.g. js`...`
import {AppSyncConfig} from "./appSyncLookup";

export const loaderTemplate = (appSyncConfig: AppSyncConfig, mainJsFilename: string) => `
  
  const script = document.createElement('script');
  script.onload = function () {
    PinBoard.mount(${JSON.stringify(appSyncConfig)});
  };
  script.src = '${mainJsFilename}';
  document.head.appendChild(script);
  
`;