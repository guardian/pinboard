import { PinBoardStack } from "../lib/stack";
import { App } from "aws-cdk-lib";

const stack = "workflow";

const app = new App();

new PinBoardStack(app, "PinBoardStack-CODE", {
  stack,
  stage: "CODE",
  domainName: "pinboard.code.dev-gutools.co.uk",
});

new PinBoardStack(app, "PinBoardStack-PROD", {
  stack,
  stage: "PROD",
  domainName: "pinboard.gutools.co.uk",
});
