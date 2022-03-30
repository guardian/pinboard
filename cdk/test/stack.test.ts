import "@aws-cdk/assert/jest";
import { SynthUtils } from "@aws-cdk/assert";
import { App } from "@aws-cdk/core";
import { PinBoardStack } from "../stack";

describe("PinBoardStack's", () => {
  it("generated CloudFormation matches the snapshot", () => {
    const app = new App();
    const stack = new PinBoardStack(app, "PinBoardStack");
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  });
});
