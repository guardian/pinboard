import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../awsIntegration";
import { Stage } from "../../types/stage";
import {
  databaseJumpHostASGLogicalID,
  getDatabaseJumpHostAsgName,
} from "../database";
import { APP } from "../../constants";

export const getDatabaseJumpHost = async (stage: Stage) => {
  const AutoScalingGroupName = getDatabaseJumpHostAsgName(stage);

  const autoscaling = new AWS.AutoScaling(standardAwsConfig);
  const ec2 = new AWS.EC2(standardAwsConfig);

  console.log(
    "Requesting a database 'jump host' (by ensuring desired count of the ASG is 1)"
  );

  // set the desired capacity to 1 (even if it's already at 1)
  await autoscaling
    .setDesiredCapacity({
      DesiredCapacity: 1,
      AutoScalingGroupName,
      HonorCooldown: false,
    })
    .promise();

  console.log("Waiting for instance to be 'running'...");

  const instanceRunningResult = await ec2
    .waitFor("instanceRunning", {
      Filters: [
        { Name: "tag:App", Values: [APP] },
        { Name: "tag:Stage", Values: [stage] },
        {
          Name: "tag:Name",
          Values: [`PinBoardStack/${databaseJumpHostASGLogicalID}`],
        },
        { Name: "instance-state-name", Values: ["running"] },
      ],
    })
    .promise();

  const maybeInstanceId =
    instanceRunningResult.Reservations?.[0]?.Instances?.[0]?.InstanceId;

  if (!maybeInstanceId) {
    throw "EC2 waiter suggested instance was running, but then doesn't have an instance for us 😢";
  }

  console.log(`Instance ${maybeInstanceId} is running 🎉`);
  console.log("Waiting for instance to have 'OK' status...");

  await ec2
    .waitFor("instanceStatusOk", {
      InstanceIds: [maybeInstanceId],
    })
    .promise();

  console.log(`Instance ${maybeInstanceId} has OK status 🎉`);

  return maybeInstanceId;
};
