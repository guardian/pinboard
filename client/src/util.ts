import { Group, User } from "../../shared/graphql/graphql";
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

export const groupToMentionHandle = (group: Group) => `@${group.name}`;

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

export const useThrottle = <E>(
  callback: (event: E) => void,
  milliseconds?: number
) => {
  //initialize throttlePause variable outside throttle function
  let throttlePause: boolean;

  const time = milliseconds || 33; // 33 default is roughly 30 times a second (approx frame rate of human eye)

  return (event: E) => {
    //don't run the function if throttlePause is true
    if (throttlePause) return;

    //set throttlePause to true after the if condition. This allows the function to be run once
    throttlePause = true;

    //setTimeout runs the callback within the specified time
    setTimeout(() => {
      callback(event);

      //throttlePause is set to false once the function has been called, allowing the throttle function to loop
      throttlePause = false;
    }, time);
  };
};
