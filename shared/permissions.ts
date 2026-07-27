import { IS_RUNNING_LOCALLY, STAGE } from "./awsIntegration";
import { init } from "@guardian/permissions-client";

export const permissionsClient = init({
  stage: STAGE,
  isRunningLocally: IS_RUNNING_LOCALLY,
});
