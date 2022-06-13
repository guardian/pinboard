import { STAGE, standardAwsConfig } from "../../shared/awsIntegration";
import * as AWS from "aws-sdk";
import { ScheduledEvent, ScheduledHandler } from "aws-lambda";
import { randomBytes } from "crypto";

const ssm = new AWS.SSM(standardAwsConfig);

const handler: ScheduledHandler = async () => {
  const salt = randomBytes(256).toString("hex");
  await ssm
    .putParameter({
      Name: `/pinboard/user-salt/${STAGE}`,
      Type: "SecureString",
      Value: salt,
      Overwrite: true,
    })
    .promise();
};

exports.handler = handler;
