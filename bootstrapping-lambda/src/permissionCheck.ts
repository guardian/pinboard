import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { getPinboardPermissionOverrides } from "../../shared/permissions";

const S3 = new AWS.S3(standardAwsConfig);

export const userHasPermission = (userEmail: string): Promise<boolean> =>
  getPinboardPermissionOverrides(S3).then(
    (overrides) =>
      !!overrides?.find(({ userId, active }) => userId === userEmail && active)
  );
