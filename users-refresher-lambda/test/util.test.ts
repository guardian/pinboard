import { extractNamesWithFallback } from "../src/util";

Object.entries({
  "joe.bloggs@guardian.co.uk": {
    firstName: "Joe",
    lastName: "Bloggs",
  },
  "foo.bar-baz@guardian.co.uk": {
    firstName: "Foo",
    lastName: "Bar-Baz",
  },
  "foo-bar.baz@guardian.co.uk": {
    firstName: "Foo-Bar",
    lastName: "Baz",
  },
  "@guardian.co.uk": {
    firstName: "",
    lastName: "",
  },
  "hello@guardian.co.uk": {
    firstName: "Hello",
    lastName: "",
  },
}).forEach(([email, expectedNamesObject]) => {
  test(`convert ${email} to display name`, () => {
    expect(extractNamesWithFallback(email)).toEqual(expectedNamesObject);
  });
});
