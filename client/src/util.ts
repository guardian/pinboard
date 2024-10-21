import isThisYear from "date-fns/isThisYear";
import isToday from "date-fns/isToday";
import differenceInMinutes from "date-fns/differenceInMinutes";
import formatDistanceStrict from "date-fns/formatDistanceStrict";
import differenceInHours from "date-fns/differenceInHours";
import format from "date-fns/format";
import isYesterday from "date-fns/isYesterday";
import differenceInCalendarWeeks from "date-fns/differenceInCalendarWeeks";

export const getTooltipText = (
  workingTitle: string | null,
  headline: string | null
) => `WT: ${workingTitle}` + (headline ? `\nHL: ${headline}` : "");

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

export const throttled = <E>(
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

export const useThrottle = throttled;

export const readAndThenSilentlyDropQueryParamFromURL = (param: string) => {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(param);
  if (!value) return value;
  url.searchParams.delete(param);
  window.history.replaceState(
    window.history.state,
    document.title,
    url.toString()
  );
  return value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- suitably generic function
export const debounce = <F extends (...args: any[]) => void>(
  f: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let waiting: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<F>) => {
    if (waiting !== undefined) {
      clearTimeout(waiting);
    }
    waiting = setTimeout(() => f(...args), delay);
  };
};
