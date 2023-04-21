import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { basicMessage, EmailBody, PerPersonDetails } from "./email";
import { render as renderToString } from "preact-render-to-string";

const emailer = new SESClient(standardAwsConfig);

export const sendEmail = async (
  email: string,
  perPersonDetails: PerPersonDetails
) => {
  const count = Object.values(perPersonDetails).flatMap((_) => _.items).length;
  if (count === 0) {
    throw new Error("No items to email about");
  }
  console.log(`Sending email to ${email} about ${count} missed mentions`);
  return emailer.send(
    new SendEmailCommand({
      Source:
        STAGE === "PROD"
          ? "pinboard <mentions@pinboard.gutools.co.uk>"
          : "pinboard CODE <mentions@pinboard.code.dev-gutools.co.uk>",
      Destination: {
        ToAddresses: [email],
      },
      ReplyToAddresses: ["pinboard@guardian.co.uk"],
      Message: {
        Subject: {
          Data: `📌 ${count} missed mention${
            count > 1 ? "s" : ""
          } (ref: ${Date.now()})`, //FIXME find an alternate way to prevent threading
        },
        Body: {
          Text: { Data: basicMessage },
          Html: { Data: renderToString(EmailBody(perPersonDetails)) },
        },
      },
    })
  );
};
