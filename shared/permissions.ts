import { STAGE } from "./awsIntegration";
import * as AWS from "aws-sdk";

interface Override {
  userId: string;
  active: boolean;
}

interface Permission {
  permission: {
    name: string;
    app: string;
  };
  overrides: Override[];
}

export const PERMISSIONS_BUCKET = "permissions-cache";
export const PERMISSIONS_FILENAME = "permissions.json";

export const getPinboardPermissionOverrides = (S3: AWS.S3) =>
  S3.getObject({
    Bucket: PERMISSIONS_BUCKET,
    Key: `${STAGE}/${PERMISSIONS_FILENAME}`,
  })
    .promise()
    .then(({ Body }) => {
      if (!Body) {
        throw Error("could not read permissions");
      }

      const allPermissions = JSON.parse(Body.toString()) as Permission[];

      return allPermissions.find(
        ({ permission }) =>
          // see https://github.com/guardian/permissions/pull/128
          permission.app === "pinboard" && permission.name === "pinboard"
      )?.overrides;
    });
