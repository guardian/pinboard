export interface GrafanaResponseFormat {
  target: string;
  datapoints: [number, number][];
}

interface DatabaseUniqueUserResponse {
  hour: string;
  uniqueUsers: string;
}

export const mapAppSyncResponseToGrafanaFormat = (
  databaseJsonResponse: string
): GrafanaResponseFormat[] => {
  const responseArray = JSON.parse(databaseJsonResponse);
  const mappedResponseObjects = responseArray.map(
    (item: DatabaseUniqueUserResponse) => [
      parseInt(item.uniqueUsers),
      Date.parse(item.hour),
    ]
  );
  return [{ target: "uniqueUsers", datapoints: mappedResponseObjects }];
};
