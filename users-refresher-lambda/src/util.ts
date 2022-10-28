import { admin_directory_v1 } from "@googleapis/admin";
import { WithNames } from "../../shared/types/withNames";
import { extractNameFromEmail } from "../../shared/util";

export interface User extends WithNames {
  email: string;
  isMentionable: boolean;
  avatarUrl?: string | null;
  googleID: string | null; // null denotes that the user is not in the Google directory (typically because they have left the organisation)
}

export interface UserLookup {
  [email: string]: User;
}

export const extractNamesWithFallback = (
  email: string,
  names?: admin_directory_v1.Schema$UserName
): WithNames => {
  if (names && names.givenName && names.familyName) {
    return {
      firstName: names.givenName,
      lastName: names.familyName,
    };
  }
  return extractNameFromEmail(email);
};

export const handleUpsertError = (user: User) => (error: Error) => {
  console.error(`Error upserting user ${user.email}\n`, error);
  console.error(user);
};
