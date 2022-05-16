import { User } from "../../shared/graphql/graphql";
import { PinboardData } from "../../shared/graphql/extraTypes";
import isThisYear from "date-fns/isThisYear";
import isToday from "date-fns/isToday";
import differenceInMinutes from "date-fns/differenceInMinutes";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import differenceInHours from "date-fns/differenceInHours";
import format from "date-fns/format";
import isYesterday from "date-fns/isYesterday";
import differenceInCalendarWeeks from "date-fns/differenceInCalendarWeeks";

export const userToMentionHandle = (user: User) =>
  `@${user.firstName} ${user.lastName}`;

export const getTooltipText = (pinboardData: PinboardData) =>
  `WT: ${pinboardData.title}` +
  (pinboardData.headline ? `\nHL: ${pinboardData.headline}` : "");

export const formatDateTime = (
  timestamp: number,
  isPartOfSentence?: true,
  withAgo?: true
): string => {
  const now = Date.now();
  if (isThisYear(timestamp)) {
    if (isToday(timestamp)) {
      if (differenceInMinutes(now, timestamp) < 1) {
        return isPartOfSentence ? "just now" : "Now";
      } else if (differenceInMinutes(now, timestamp) === 1) {
        return (
          formatDistanceStrict(timestamp, now, {
            roundingMethod: "floor",
          }).slice(0, -3) + (withAgo ? " ago" : "")
        );
      } else if (differenceInHours(now, timestamp) < 1) {
        return (
          formatDistanceStrict(timestamp, now, {
            roundingMethod: "floor",
          }).slice(0, -4) + (withAgo ? " ago" : "")
        );
      }
      return format(timestamp, "HH:mm");
    } else if (isYesterday(timestamp)) {
      return format(timestamp, "'Yesterday' HH:mm");
    } else if (
      differenceInCalendarWeeks(now, timestamp, { weekStartsOn: 1 }) === 0
    ) {
      return format(timestamp, "eee HH:mm");
    } else {
      return format(timestamp, "d MMM HH:mm");
    }
  } else {
    return format(timestamp, "d MMM yyyy HH:mm");
  }
};
