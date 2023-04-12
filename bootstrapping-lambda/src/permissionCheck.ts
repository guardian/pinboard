import { S3 } from "@aws-sdk/client-s3";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { getPinboardPermissionOverrides } from "../../shared/permissions";

const s3 = new S3(standardAwsConfig);

export const userHasPermission = (userEmail: string): Promise<boolean> =>
  getPinboardPermissionOverrides(s3).then(
    (overrides) =>
      !!overrides?.find(({ userId, active }) => userId === userEmail && active)
  );
