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

async function loadPermissions() {
  const { Body } = await s3.getObject({
    Bucket: "permissions-cache",
    Key: `${STAGE}/permissions.json`,
  });
  if (!Body) {
    throw Error("could not read permissions");
  }
  const transformedBody = await Body.transformToString();
  const allPermissions = JSON.parse(transformedBody) as Permission[];
  return { allPermissions, loadTime: new Date() };
}

let cache = loadPermissions();

async function getOrRefresh() {
  const prevCache = await cache;

  const now = new Date();
  const sixtySecsAgo = new Date(now.getTime() - 60_000);

  if (prevCache.loadTime < sixtySecsAgo) {
    cache = loadPermissions().catch((e) => {
      console.error(
        "Refreshing permissions cache failed with error, so keeping stale cache...",
        e
      );
      return { allPermissions: prevCache.allPermissions, loadTime: new Date() };
    });
  }

  const { allPermissions } = await cache;
  return allPermissions;
}

const getAllPermissions = () => {
  return getOrRefresh();
};

const getAllPinboardOverrides = async (
  permissionName: string
): Promise<Override[] | undefined> => {
  const allPermissions = await getAllPermissions();

  return allPermissions.find(
    ({ permission }) =>
      permission.app === "pinboard" && permission.name === permissionName
  )?.overrides;
};

export const getPinboardAccessPermissionOverrides = () =>
  getAllPinboardOverrides("pinboard");

export const listUserPermissions = async (userEmail: string) => {
  const allPermissions = await getAllPermissions();
  const relevantPermissions = [];
  for (const { permission, overrides } of allPermissions) {
    if (permission.app === "pinboard") {
      for (const override of overrides) {
        if (override.active && override.userId === userEmail) {
          relevantPermissions.push(permission.name);
          break;
        }
      }
    }
  }
  return relevantPermissions;
};

export const userHasPermission = async (
  userEmail: string,
  permission: string
): Promise<boolean> => {
  const overrides = await getAllPinboardOverrides(permission);

  return Boolean(
    overrides?.some(({ userId, active }) => userId === userEmail && active)
  );
};
