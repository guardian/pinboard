import { PinBoardStack } from "./stack";
import { App, DefaultStackSynthesizer } from "aws-cdk-lib";

const app = new App();
new PinBoardStack(app, "PinBoardStack", {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});
