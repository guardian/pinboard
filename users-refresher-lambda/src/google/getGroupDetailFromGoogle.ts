import { admin_directory_v1 } from "@googleapis/admin";
import { GroupsToLookup } from "../util";

interface Group {
  shorthand: string;
  googleID: string;
  name: string;
  primaryEmail: string;
  otherEmails: string[];
}

export const getGroupDetailFromGoogle = async (
  directoryService: admin_directory_v1.Admin,
  groupsToLookup: GroupsToLookup
): Promise<Group[]> =>
  Object.entries(groupsToLookup).reduce(
    async (acc, [shorthand, groupEmail]) => {
      console.log(`Google Admin Directory API call (groups.get)`);
      const { data } = await directoryService.groups.get({
        groupKey: groupEmail,
      });

      if (!data.id || !data.name || !data.email) {
        console.warn(
          `Group '${shorthand}' (${groupEmail}) is missing key information so skipping`,
          data
        );
        return acc;
      }

      return [
        ...(await acc),
        {
          shorthand,
          googleID: data.id,
          name: data.name,
          primaryEmail: data.email,
          otherEmails: [
            ...(data.aliases || []),
            ...(data.nonEditableAliases || []),
          ],
        },
      ];
    },
    Promise.resolve([]) as Promise<Group[]>
  );
