import { AutoScaling } from "@aws-sdk/client-auto-scaling";
import {
  EC2,
  waitUntilInstanceRunning,
  waitUntilInstanceStatusOk,
} from "@aws-sdk/client-ec2";
import { standardAwsConfig } from "../../awsIntegration";
import { Stage } from "../../types/stage";
import { getDatabaseJumpHostAsgName } from "../database";
import { APP } from "../../constants";

export const getDatabaseJumpHost = async (stage: Stage) => {
  const AutoScalingGroupName = getDatabaseJumpHostAsgName(stage);

  const autoscaling = new AutoScaling(standardAwsConfig);
  const ec2 = new EC2(standardAwsConfig);

  console.log(
    "Requesting a database 'jump host' (by ensuring desired count of the ASG is 1)"
  );

  // set the desired capacity to 1 (even if it's already at 1)
  await autoscaling.setDesiredCapacity({
    DesiredCapacity: 1,
    AutoScalingGroupName,
    HonorCooldown: false,
  });

  console.log("Waiting for instance to be 'running'...");

  const instanceRunningResult = await waitUntilInstanceRunning(
    {
      client: ec2,
      maxWaitTime: 300,
    },
    {
      Filters: [
        { Name: "tag:App", Values: [APP] },
        { Name: "tag:Stage", Values: [stage] },
        {
          Name: "tag:aws:autoscaling:groupName",
          Values: [getDatabaseJumpHostAsgName(stage)],
        },
        { Name: "instance-state-name", Values: ["running"] },
      ],
    }
  );

  const maybeInstanceId =
    instanceRunningResult.reason?.Reservations?.[0]?.Instances?.[0]?.InstanceId;

  if (!maybeInstanceId) {
    throw "EC2 waiter suggested instance was running, but then doesn't have an instance for us 😢";
  }

  console.log(`Instance ${maybeInstanceId} is running 🎉`);
  console.log("Waiting for instance to have 'OK' status...");

  await waitUntilInstanceStatusOk(
    {
      client: ec2,
      maxWaitTime: 300,
    },
    {
      InstanceIds: [maybeInstanceId],
    }
  );

  console.log(`Instance ${maybeInstanceId} has OK status 🎉`);

  return maybeInstanceId;
};
