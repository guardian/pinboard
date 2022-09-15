import { App, assertions } from "aws-cdk-lib";
import { PinBoardStack } from "../stack";

describe("PinBoardStack's", () => {
  it("generated CloudFormation matches the snapshot", () => {
    const app = new App();
    const stack = new PinBoardStack(app, "PinBoardStack");
    expect(assertions.Template.fromStack(stack)).toMatchSnapshot();
  });
});
