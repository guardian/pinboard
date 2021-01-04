import * as AWS from "aws-sdk";
import { STAGE, standardAwsConfig } from "./awsIntegration";

const s3Client = new AWS.S3(standardAwsConfig);

interface Permission {
  permission: {
    name: string;
    app: string;
  };
  overrides: Array<{
    userId: string;
    active: boolean;
  }>;
}

export const userHasPermission = (userEmail: string): Promise<boolean> =>
  s3Client
    .getObject({
      Bucket: "permissions-cache",
      Key: `${STAGE}/permissions.json`,
    })
    .promise()
    .then(({ Body }) => {
      if (!Body) {
        throw Error("could not read permissions");
      }

      const permissions: Permission[] = JSON.parse(Body.toString());

      // see https://github.com/guardian/permissions/pull/128
      return !!permissions.find(
        (_) =>
          _.permission.app === "pinboard" &&
          _.permission.name === "pinboard" &&
          _.overrides.find(
            (override) => override.userId === userEmail && override.active
          )
      );
    });
