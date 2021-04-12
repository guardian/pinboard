import { User } from "../../shared/graphql/graphql";

import differenceInMinutes from "date-fns/differenceInMinutes";
import format from "date-fns/format";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import isThisWeek from "date-fns/isThisWeek";
import isThisYear from "date-fns/isThisYear";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import differenceInHours from "date-fns/differenceInHours";
import { differenceInCalendarWeeks } from "date-fns";

export const userToMentionHandle = (user: User) =>
  `@${user.firstName} ${user.lastName}`;

export const formattedDateTime = (timestamp: number): string => {
  const now = Date.now();
  if (isThisYear(timestamp)) {
    if (isToday(timestamp)) {
      if (differenceInMinutes(now, timestamp) < 1) {
        return "Now";
      } else if (differenceInMinutes(now, timestamp) === 1) {
        return formatDistanceStrict(timestamp, now).slice(0, -3);
      } else if (differenceInHours(now, timestamp) < 1) {
        return formatDistanceStrict(timestamp, now).slice(0, -4);
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
