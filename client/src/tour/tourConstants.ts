import {
  PinboardData,
  PinboardDataWithClaimCounts,
} from "../../../shared/graphql/extraTypes";
import { User } from "../../../shared/graphql/graphql";

export const demoPinboardData: PinboardData = {
  id: "DEMO",
  title: "Interactive Demo",
  headline: "Pinboard Interactive Demo",
  composerId: null,
  isNotFound: null,
  status: null,
  trashed: null,
};
export const demoPinboardsWithClaimCounts: PinboardDataWithClaimCounts[] = [
  {
    id: "DEMO-TEAM-1",
    title: "stop calling us Tories, say Tories",
    headline: "Please stop calling us Tories, say Tories",
    composerId: null,
    isNotFound: null,
    status: null,
    trashed: null,
    unclaimedCount: 3,
    othersClaimedCount: 5,
    yourClaimedCount: 0,
    hasUnread: true,
    notClaimableCount: 1,
    pinboardId: "DEMO-TEAM-1",
    latestGroupMentionItemId: "123",
  },
  {
    id: "DEMO-TEAM-2",
    title: "Is AI getting out of control?",
    headline: "Is AI getting out of control?",
    composerId: null,
    isNotFound: null,
    status: null,
    trashed: null,
    unclaimedCount: 1,
    othersClaimedCount: 2,
    yourClaimedCount: 1,
    hasUnread: false,
    notClaimableCount: 1,
    pinboardId: "DEMO-TEAM-2",
    latestGroupMentionItemId: "123",
  },
  {
    id: "DEMO-TEAM-3",
    title: "The secret lives of capybaras",
    headline: "The secret lives of capybaras",
    composerId: null,
    isNotFound: null,
    status: null,
    trashed: null,
    unclaimedCount: 0,
    othersClaimedCount: 3,
    yourClaimedCount: 2,
    hasUnread: true,
    notClaimableCount: 1,
    pinboardId: "DEMO-TEAM-3",
    latestGroupMentionItemId: "123",
  },
  // TODO - add more
];
export const demoUser: User = {
  email: "pinboard.demo@guardian.co.uk",
  firstName: "Pinboard",
  lastName: "Demo",
  isMentionable: false, // TODO - ensure demo user is NOT mentionable outside the tour before making this 'true'
  avatarUrl: null, // TODO - add Avatar image for demo user (e.g. 📌)
};
export const demoMentionableUsers: User[] = [
  {
    email: "hazel.nutt@guardian.co.uk",
    firstName: "Hazel",
    lastName: "Nutt",
    isMentionable: true,
    avatarUrl: null,
  },
  {
    email: "chris.p.bacon@guardian.co.uk",
    firstName: "Chris P.",
    lastName: "Bacon",
    isMentionable: true,
    avatarUrl: null,
  },
  {
    email: "bess.twishes@guardian.co.uk",
    firstName: "Bess",
    lastName: "Twishes",
    isMentionable: true,
    avatarUrl: null,
  },
];
