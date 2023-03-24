import { STAGE } from "./awsIntegration";
import { S3 } from "@aws-sdk/client-s3";

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

export const getPinboardPermissionOverrides = (S3: S3) =>
  S3.getObject({
    Bucket: "permissions-cache",
    Key: `${STAGE}/permissions.json`,
  })
    .then(({ Body }) => {
      if (!Body) {
        throw Error("could not read permissions");
      }
      return Body.transformToString();
    })
    .then((Body) => {
      const allPermissions = JSON.parse(Body) as Permission[];

      return allPermissions.find(
        ({ permission }) =>
          // see https://github.com/guardian/permissions/pull/128
          permission.app === "pinboard" && permission.name === "pinboard"
      )?.overrides;
    });
