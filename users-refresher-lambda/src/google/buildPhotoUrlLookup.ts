import { people_v1 } from "@googleapis/people";

interface PhotoUrlLookup {
  [resourceName: string]: string;
}
export const buildPhotoUrlLookup = async (
  peopleService: people_v1.People,
  resourceNames: string[]
): Promise<PhotoUrlLookup> => {
  if (resourceNames.length === 0) {
    return {};
  }
  const hasMoreThan50Remaining = resourceNames.length > 50;
  const usersToRequestInThisBatch = hasMoreThan50Remaining
    ? resourceNames.slice(0, 50)
    : resourceNames;

  console.log(
    `Google People API call (for ${usersToRequestInThisBatch.length} users)`
  );

  const thisBatchLookup = (
    await peopleService.people.getBatchGet({
      personFields: "photos",
      resourceNames: usersToRequestInThisBatch,
    })
  ).data.responses?.reduce((acc, { person, requestedResourceName }) => {
    const maybePhotoUrl = person?.photos?.find(({ url }) => url)?.url;
    return requestedResourceName && maybePhotoUrl
      ? {
          ...acc,
          [requestedResourceName]: maybePhotoUrl,
        }
      : acc;
  }, {} as PhotoUrlLookup);

  if (!thisBatchLookup) {
    throw Error();
  }

  return hasMoreThan50Remaining
    ? {
        ...thisBatchLookup,
        ...(await buildPhotoUrlLookup(
          peopleService,
          resourceNames.slice(50, resourceNames.length)
        )),
      }
    : thisBatchLookup;
};
