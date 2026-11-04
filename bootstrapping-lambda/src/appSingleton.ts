import { initPanda } from "./panDomainAuth";
import { initApp } from "./app";

let appPromise: Promise<ReturnType<typeof initApp>> | undefined;

export function getApp() {
  if (appPromise !== undefined) {
    return appPromise;
  }
  appPromise = initPanda()
    .then((panda) => initApp(panda))
    .catch((error: unknown) => {
      console.error("Failed to initialise app", error);
      // clear the cached failure so the next caller retries
      appPromise = undefined;
      throw error;
    });
  return appPromise;
}
