import { admin_directory_v1 } from "@googleapis/admin";
import { extractNamesWithFallback, User, UserLookup } from "../util";

export const buildUserLookupFromGoogle = async (
  directoryService: admin_directory_v1.Admin,
  emailsToLookup: string[],
  nextPageToken?: string
): Promise<UserLookup> => {
  console.log(`Google Admin Directory API call (users.list)`);

  const page = await directoryService.users.list({
    maxResults: 500,
    pageToken: nextPageToken,
    domain: "guardian.co.uk",
    projection: "BASIC",
  });

  console.log(
    `...processing paged response, containing ${page?.data?.users?.length} users`
  );

  const thisPagesLookup: UserLookup = (page.data?.users || []).reduce(
    (acc, { id, emails, name }) => {
      const maybeRelevantUserEmail =
        emails &&
        emailsToLookup.find(
          (lookupEmail) =>
            lookupEmail &&
            emails.find(
              ({ address }: { address: string }) =>
                address === lookupEmail.toLowerCase()
            )
        );
      if (!maybeRelevantUserEmail || !id) {
        return acc;
      }
      const names = extractNamesWithFallback(maybeRelevantUserEmail, name);
      const relevantUser: User = {
        googleID: id,
        email: maybeRelevantUserEmail,
        ...names,
        isMentionable: true,
      };
      return {
        ...acc,
        [maybeRelevantUserEmail]: relevantUser,
      };
    },
    {} as UserLookup
  );

  return page.data?.nextPageToken
    ? {
        ...thisPagesLookup,
        ...(await buildUserLookupFromGoogle(
          directoryService,
          emailsToLookup,
          page.data?.nextPageToken
        )),
      }
    : thisPagesLookup;
};
