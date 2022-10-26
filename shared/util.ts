import { WithNames } from "./types/withNames";

const capitalise = (str: string) =>
  str &&
  str
    .split("-")
    .map(
      ([firstLetter, ...otherLetters]) =>
        `${firstLetter.toUpperCase()}${otherLetters.join("")}`
    )
    .join("-");

export const extractNameFromEmail = (email: string): WithNames => {
  const namePartOfEmail = email.toLowerCase().split("@")?.[0];
  const namePartsFromEmail = namePartOfEmail?.split(".");
  return {
    firstName: capitalise(namePartsFromEmail[0] || namePartOfEmail),
    lastName: capitalise(namePartsFromEmail[1] || ""),
  };
};
