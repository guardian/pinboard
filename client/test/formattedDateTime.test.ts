import subDays from "date-fns/subDays";
import subHours from "date-fns/subHours";
import subMinutes from "date-fns/subMinutes";
import subYears from "date-fns/subYears";

import { formattedDateTime } from "../src/util";

const MOCK_TIMESTAMP = new Date(2021, 3, 15, 14, 32).valueOf(); // Thu Apr 15 2021 14:32:00 GMT+0100 (British Summer Time)

test("display is correct if timestamp is now", () => {
  const now = Date.now();
  expect(formattedDateTime(now)).toBe("Now");
});

test("display is correct if timestamp is 1 min ago exactly", () => {
  const oneMinAgo = subMinutes(Date.now(), 1).valueOf();
  expect(formattedDateTime(oneMinAgo)).toBe("1 min");
});

test("display is correct if timestamp is between 1 min and 1 hr ago", () => {
  const lessThanHr = subMinutes(Date.now(), 59).valueOf();
  expect(formattedDateTime(lessThanHr)).toBe("59 min");
});

test("display is correct if timestamp is 1 hr ago exactly", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const oneHrAgo = subHours(Date.now(), 1).valueOf();
  expect(formattedDateTime(oneHrAgo)).toBe("13:32");
});

test("display is correct if timestamp is today more than 1 hr ago", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const someTimeAgoToday = subHours(Date.now(), 9).valueOf();
  expect(formattedDateTime(someTimeAgoToday)).toBe("05:32");
});

test("display is correct if timestamp is yesterday", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const yesterday = subDays(Date.now(), 1).valueOf();
  expect(formattedDateTime(yesterday)).toBe("Yesterday 14:32");
});

test("display is correct if timestamp is less than a week go but more than yesterday", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const thisWeek = subDays(Date.now(), 3).valueOf();
  expect(formattedDateTime(thisWeek)).toBe("Mon 14:32");
});

test("display correctly if timestamp is less than 7 days ago but in previous week (week starts on Monday)", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const lastWeek = subDays(Date.now(), 4).valueOf();
  expect(formattedDateTime(lastWeek)).toBe("11 Apr 14:32");
});

test("display correctly if timestamp is this year", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const thisYear = subDays(Date.now(), 7).valueOf();
  expect(formattedDateTime(thisYear)).toBe("8 Apr 14:32");
});

test("display correctly if timestamp is last year", () => {
  Date.now = jest.fn(() => MOCK_TIMESTAMP);
  const lastYear = subYears(Date.now(), 1).valueOf();
  expect(formattedDateTime(lastYear)).toBe("15 Apr 2020 14:32");
});
