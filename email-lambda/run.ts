import { handler } from "./src";
import { createDatabaseTunnel } from "shared/database/local/databaseTunnel";
import { sendEmail } from "./src/sendEmail";
import { getYourEmail } from "shared/local/yourEmail";
import prompts from "prompts";

(async () => {
  // noinspection InfiniteLoopJS
  while (
    // eslint-disable-next-line no-constant-condition
    true
  ) {
    await (
      await prompts({
        type: "select",
        name: "run",
        message: "What do you want to do?",
        choices: [
          {
            title: "send yourself a sample email",
            value: async () => {
              const yourDotComEmail = (await getYourEmail()).replace(
                "guardian.co.uk",
                "theguardian.com" //TODO this will likely need to change to gutools.co.uk briefly until SES is PROD mode, then this replace can be removed entirely
              );

              const sendResult = await sendEmail(yourDotComEmail, {
                "65283": {
                  workingTitle: "Pinboard email-lambda DEV",
                  headline:
                    "Never miss a pinboard mention with this cool new feature",
                  items: [
                    {
                      id: "2616",
                      message:
                        "Hi @Tom Richards this is a test message for the email-lambda",
                      thumbnailURL: null,
                      timestamp: new Date("2023-05-12T11:48:25.504Z"),
                    },
                    {
                      id: "2617",
                      message:
                        "Here's another mention @Tom Richards but this time with a piccy...",
                      thumbnailURL:
                        "https://d2av06b16cc3yv.cloudfront.net/a/7/3/9/f/2/a739f22a4fe2da157cc7602c118406639653013a?Expires=1683895136&Signature=SNNeWOEggAL6Ym15Hcm3M1o8PNZG-JRdFmlSZcyPrFbnSbMsnaCkrqAmt2zaihhAwDztwytARUTW3gE60QXkHw6WnSMlof1UaijSpbfy9bKBeypD614AI5DihRmaWLkR1HxYa8czVW5kEvZ1iTeL1PIyjXs~SjIUvdan11w1yIqVptQaWW8L87SrzI8SrPSFRHxAYG3wvvSD93eRhLLbifnGD0Lyzme7e9nZ3pSppzA~a1E5p-zzj-3YphwjXNGeFrXITDbg1sqycFOcQmIWM535rd7bg2lMywFfFjl717pRW17x3jD9A7wxpioJCzgSQ1tMMH1xdfBEuI1~-OFjPw__&Key-Pair-Id=APKAJPTTPZNNPHQSSUAQ",
                      timestamp: new Date("2023-05-12T12:07:10.039Z"),
                    },
                  ],
                },
                "65284": {
                  workingTitle: "Some more pinboard email-lambda testing",
                  headline: "This really is a brilliant feature",
                  items: [
                    {
                      id: "2618",
                      message: "Hi @Tom Richards this is really great",
                      thumbnailURL: null,
                      timestamp: new Date("2023-05-12T12:12:43.803Z"),
                    },
                  ],
                },
              });

              console.log(sendResult);
            },
            selected: true,
          },
          {
            title: "process missed mentions in CODE",
            value: async () => {
              await createDatabaseTunnel({ stage: "CODE" });
              await handler();
            },
          },
        ],
      })
    ).run();
  }
})();
