import { STAGE, standardAwsConfig } from "./awsIntegration";
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

const s3 = new S3(standardAwsConfig);

const getAllPinboardOverrides = async (
  permissionName: string
): Promise<Override[] | undefined> => {
  const { Body } = await s3.getObject({
    Bucket: "permissions-cache",
    Key: `${STAGE}/permissions.json`,
  });
  if (!Body) {
    throw Error("could not read permissions");
  }
  const transformedBody = await Body.transformToString();
  const allPermissions = JSON.parse(transformedBody) as Permission[];

  return allPermissions.find(
    ({ permission }) =>
      permission.app === "pinboard" && permission.name === permissionName
  )?.overrides;
};

export const getPinboardAccessPermissionOverrides = () =>
  getAllPinboardOverrides("pinboard");

export const userHasPermission = async (
  userEmail: string,
  permission: string
): Promise<boolean> => {
  const overrides = await getAllPinboardOverrides(permission);

  return Boolean(
    overrides?.find(({ userId, active }) => userId === userEmail && active)
  );
};

export const ACCESS_PERMISSION = "pinboard";
export const ADMIN_PERMISSION = "pinboard_admin";
