import { App, assertions } from "aws-cdk-lib";
import { PinBoardStack } from "./stack";

describe("PinBoardStack's", () => {
  it("generated CloudFormation matches the snapshot", () => {
    const app = new App();
    const stack = new PinBoardStack(app, "PinBoardStack-TEST", {
      domainName: "pinboard.test.dev-gutools.co.uk",
      stack: "workflow",
      stage: "TEST",
    });
    expect(assertions.Template.fromStack(stack)).toMatchSnapshot();
  });
});
