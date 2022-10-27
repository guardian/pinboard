import fetch from "node-fetch";

/*
 * The Google People API returns an unstable avatar URL (i.e. different every time)
 * for a handful of users (long-serving staff members we think - i.e. old avatars).
 * So this function downloads the avatars to compare the file content, so we can
 * only update the DB when the avatar image has truly changed.
 * */
export const isDefinitelyDifferentAvatar = async (
  userEmail: string,
  databaseAvatarUrl: string | null | undefined,
  apiAvatarUrl: string | null
): Promise<boolean> => {
  if (databaseAvatarUrl === apiAvatarUrl) {
    return false;
  }
  if (!databaseAvatarUrl || !apiAvatarUrl) {
    return true;
  }
  const [databaseAvatar, apiAvatar] = await Promise.all(
    [databaseAvatarUrl, apiAvatarUrl].map((url) =>
      fetch(url).then((res) => res.text())
    )
  );
  if (databaseAvatar === apiAvatar) {
    console.warn(
      `Avatar for ${userEmail} has the same content, but the URLs are different - thanks Google!`
    );
  }
  return databaseAvatar !== apiAvatar;
};
