import { admin_directory_v1 } from "@googleapis/admin";
import { GroupsToLookup } from "../util";

interface GroupMember {
  groupShorthand: string;
  userGoogleID: string;
}

export const getGroupMembersFromGoogle = async (
  directoryService: admin_directory_v1.Admin,
  groupsToLookup: GroupsToLookup
): Promise<GroupMember[]> =>
  Object.entries(groupsToLookup).reduce(
    async (acc, [shorthand, groupEmail]) => {
      console.log(`Google Admin Directory API call (members.get)`);
      const { data } = await directoryService.members.list({
        groupKey: groupEmail,
        maxResults: 200,
        includeDerivedMembership: true,
      });
      if (data.nextPageToken) {
        console.warn(
          `Group '${shorthand}' (${groupEmail}) has more than 200 members, which is not supported.`
        );
        return acc;
      }
      const members: GroupMember[] = (data.members || []).reduce(
        (memberAcc, member) => {
          if (!member.id) {
            console.warn(
              `Skipping member of Group '${shorthand}' (${groupEmail}) due to a missing GoogleID`,
              member
            );
            return memberAcc;
          }
          return [
            ...memberAcc,
            {
              groupShorthand: shorthand,
              userGoogleID: member.id,
            },
          ];
        },
        [] as GroupMember[]
      );

      return [...(await acc), ...members];
    },
    Promise.resolve([]) as Promise<GroupMember[]>
  );
