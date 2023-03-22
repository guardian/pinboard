import {
  PinboardData,
  PinboardDataWithClaimCounts,
} from "./graphql/extraTypes";
import { User } from "./graphql/graphql";

export const IS_DEMO_HEADER = "X-Is-Demo";

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
    title: "ABC",
    headline: "Pinboard ABC",
    composerId: null,
    isNotFound: null,
    status: null,
    trashed: null,
    unclaimedCount: 1,
    othersClaimedCount: 2,
    yourClaimedCount: 1,
    hasUnread: true,
    notClaimableCount: 1,
    pinboardId: "DEMO-TEAM-1",
    latestGroupMentionItemId: "123",
  },
];

export const demoUser: User = {
  email: "pinboard.demo@guardian.co.uk",
  firstName: "Pinboard",
  lastName: "Demo",
  isMentionable: false, // TODO - ensure demo user is NOT mentionable outside the tour before making this 'true'
  avatarUrl: null, // TODO - add Avatar image for demo user (e.g. 📌)
};
