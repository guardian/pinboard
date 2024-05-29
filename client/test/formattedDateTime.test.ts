import subDays from "date-fns/subDays";
import subHours from "date-fns/subHours";
import subMinutes from "date-fns/subMinutes";
import subSeconds from "date-fns/subSeconds";
import subYears from "date-fns/subYears";

import { formatDateTime } from "../src/util";

const MOCK_TIMESTAMP = new Date(2021, 3, 15, 14, 32).valueOf(); // Thu Apr 15 2021 14:32:00 GMT+0100 (British Summer Time)

test("display is correct if timestamp is now", () => {
  const now = Date.now();
  expect(formatDateTime(now)).toBe("Now");
});

test("display is correct if timestamp is 1 min ago exactly", () => {
  const oneMinAgo = subMinutes(Date.now(), 1).valueOf();
  expect(formatDateTime(oneMinAgo)).toBe("1 min");
});

test("display is correct if timestamp is between 1 min and 2 mins ago", () => {
  const almostTwoMinsAgo = subSeconds(Date.now(), 95).valueOf();
  expect(formatDateTime(almostTwoMinsAgo)).toBe("1 min");
});

test("display is correct if timestamp is between 2 min and 1 hr ago", () => {
  const twoMinsAgo = subMinutes(Date.now(), 2).valueOf();
  expect(formatDateTime(twoMinsAgo)).toBe("2 min");
  const lessThanHr = subMinutes(Date.now(), 59).valueOf();
  expect(formatDateTime(lessThanHr)).toBe("59 min");
  const pluralMinsWithAgo = subMinutes(Date.now(), 3).valueOf();
  expect(formatDateTime(pluralMinsWithAgo, false, true)).toBe("3 mins ago");
});

test("display is correct if passed a string", () => {
  const twoMinsAgoString = subMinutes(Date.now(), 2).toISOString();
  expect(formatDateTime(twoMinsAgoString)).toBe("2 min");
});

test("display is correct if timestamp is 1 hr ago exactly", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const oneHrAgo = subHours(Date.now(), 1).valueOf();
  expect(formatDateTime(oneHrAgo)).toBe("13:32");
});

test("display is correct if timestamp is today more than 1 hr ago", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const someTimeAgoToday = subHours(Date.now(), 9).valueOf();
  expect(formatDateTime(someTimeAgoToday)).toBe("05:32");
});

test("display is correct if timestamp is yesterday", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const yesterday = subDays(Date.now(), 1).valueOf();
  expect(formatDateTime(yesterday)).toBe("Yesterday 14:32");
});

test("display is correct if timestamp is less than a week go but more than yesterday", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const thisWeek = subDays(Date.now(), 3).valueOf();
  expect(formatDateTime(thisWeek)).toBe("Mon 14:32");
});

test("display correctly if timestamp is less than 7 days ago but in previous week (week starts on Monday)", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const lastWeek = subDays(Date.now(), 4).valueOf();
  expect(formatDateTime(lastWeek)).toBe("11 Apr 14:32");
});

test("display correctly if timestamp is this year", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const thisYear = subDays(Date.now(), 7).valueOf();
  expect(formatDateTime(thisYear)).toBe("8 Apr 14:32");
});

test("display correctly if timestamp is last year", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const lastYear = subYears(Date.now(), 1).valueOf();
  expect(formatDateTime(lastYear)).toBe("15 Apr 2020 14:32");
});
