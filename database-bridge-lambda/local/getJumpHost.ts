import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { Stage } from "../../shared/types/stage";
import { getDatabaseJumpHostAsgName } from "../../shared/database";
import { APP } from "../../shared/constants";

export const getJumpHost = async (stage: Stage) => {
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

  console.log("Waiting for instance to be 'running'");

  const instanceWaitResult = await ec2
    .waitFor("instanceRunning", {
      Filters: [
        { Name: "tag:App", Values: [APP] },
        { Name: "tag:Stage", Values: [stage] },
        { Name: "tag:Name", Values: ["PinBoardStack/DatabaseJumpHostASG"] },
      ],
    })
    .promise();

  const maybeInstanceId =
    instanceWaitResult.Reservations?.[0]?.Instances?.[0]?.InstanceId;

  if (!maybeInstanceId) {
    throw "EC2 waiter suggested instance was ready, but then doesn't have an instance for us 😢";
  }

  console.log(`Instance ${maybeInstanceId} is running 🎉`);

  return maybeInstanceId;
};
