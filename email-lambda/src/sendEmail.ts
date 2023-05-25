import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { basicMessage, EmailBody, PerPersonDetails } from "./email";
import { renderToString } from "preact-render-to-string";

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

  const emailHTML = renderToString(EmailBody(perPersonDetails));

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
          Data: `📌 You might have missed ${count} message${
            count > 1 ? "s" : ""
          } in Pinboard (ref: ${Date.now()})`, //TODO find an alternate way to prevent threading
        },
        Body: {
          Text: { Data: basicMessage },
          Html: { Data: emailHTML },
        },
      },
    })
  );
};
