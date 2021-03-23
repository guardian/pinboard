import { User } from "../../shared/graphql/graphql";

export const userToMentionHandle = (user: User) =>
  `@${user.firstName} ${user.lastName}`;
