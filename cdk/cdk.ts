import * as cdk from "@aws-cdk/core";
import { PinBoardStack } from "./stack";

const app = new cdk.App();
new PinBoardStack(app, "PinBoardStack");
