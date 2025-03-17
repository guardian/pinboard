import { sendEmail } from "./src/sendEmail";
import { getYourEmail } from "shared/local/yourEmail";
import prompts from "prompts";
import { createDatabaseTunnel } from "shared/database/local/databaseTunnel";
import { handler } from "./src";
import { getDatabaseConnection } from "shared/database/databaseConnection";

(async () => {
  // noinspection InfiniteLoopJS
  while (
    // eslint-disable-next-line no-constant-condition
    true
  ) {
    const yourEmail = await getYourEmail();
    const yourName = yourEmail
      .split("@")[0]
      .split(".")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join(" ");

    await (
      await prompts({
        type: "select",
        name: "run",
        message: "What do you want to do?",
        choices: [
          {
            title: "send yourself a sample individual mention email",
            value: async () =>
              sendEmail({
                email: yourEmail,
                emailData: {
                  pinboardId: "65283",
                  workingTitle: "Pinboard email-lambda DEV",
                  headline:
                    "Never miss a pinboard mention with this cool new feature",
                  firstName: "Hazel",
                  lastName: "Nutt",
                  avatarUrl:
                    "https://thumbs.dreamstime.com/z/hazelnut-5422216.jpg",
                  id: "2616",
                  type: "grid-crop",
                  message: `Hi @${yourName} this is a test message for the email-lambda, with a piccy...`,
                  thumbnailURL:
                    "https://i.guim.co.uk/img/media/5be7630c7fda4af9dfd2b2746adc4b1b6258b142/525_1014_4710_2826/master/4710.jpg?width=500&dpr=2&s=none",
                  timestamp: new Date("2023-05-12T11:48:25.504Z"),
                },
                isIndividualMentionEmail: true,
                ref: 2616,
              }).then(console.log),
          },
          {
            title: "send yourself a sample group mention email",
            value: async () =>
              sendEmail({
                email: yourEmail, // in real life this would be a mailing list address
                emailData: {
                  pinboardId: "65284",
                  workingTitle: "Some more pinboard email-lambda testing",
                  headline: "This really is a brilliant feature",
                  firstName: "Chris P.",
                  lastName: "Bacon",
                  avatarUrl:
                    "https://assets.epicurious.com/photos/57714624e43289453ac28e41/1:1/w_2560%2Cc_limit/diner-bacon-hero-22062016.jpg",
                  id: "2618",
                  type: "message-only",
                  message: "Hi @digicms this is really great",
                  thumbnailURL: null,
                  timestamp: new Date("2023-05-12T12:12:43.803Z"),
                },
                isIndividualMentionEmail: false,
                ref: 2618,
              }).then(console.log),
          },
          {
            title: "send a sample claim (for the group mention above)",
            value: async () =>
              sendEmail({
                email: yourEmail, // in real life this would be a mailing list address
                emailData: {
                  pinboardId: "65284",
                  workingTitle: "Some more pinboard email-lambda testing",
                  headline: "This really is a brilliant feature",
                  firstName: "Bess",
                  lastName: "Twishes",
                  avatarUrl: null, // intentionally null, to show render can handle people without avatars
                  id: "2619",
                  type: "claim",
                  message: null,
                  thumbnailURL: null,
                  timestamp: new Date("2023-05-12T12:07:10.039Z"),
                },
                isIndividualMentionEmail: false,
                ref: 2618, // same as the group mention above
              }).then(console.log),
          },
          {
            title:
              "locally simulate a lambda invocation for an existing item in CODE DB (with group mention)",
            value: async () => {
              console.warn(
                "you will only get the email if you are part of the @pinboardHELP group"
              );
              await createDatabaseTunnel({ stage: "CODE" });
              await handler({ itemId: 3697 });
              await handler({ itemId: 3698, maybeRelatedItemId: 3697 });
            },
          },
          {
            title:
              "locally simulate a lambda invocation for an existing item in CODE DB (where you were individually mentioned)",
            value: async () => {
              await createDatabaseTunnel({ stage: "CODE" });
              const sql = await getDatabaseConnection();
              const maybeItemWhereYouWereMentioned = (
                await sql`
                  SELECT "id"
                  FROM "Item"
                  WHERE ${yourEmail} = ANY("mentions")
                  ORDER BY "id" DESC 
                  LIMIT 1
                `
              )[0];
              if (maybeItemWhereYouWereMentioned) {
                await handler({ itemId: maybeItemWhereYouWereMentioned.id });
              } else {
                console.error(
                  `It appears you (${yourEmail}) have not been mentioned in any items in the CODE DB`
                );
              }
            },
          },
        ],
      })
    ).run();
  }
})();
