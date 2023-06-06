import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { getBasicMessage, buildEmailHTML, PerPersonDetails } from "./email";

const emailer = new SESClient(standardAwsConfig);

export const sendEmail = async (
  email: string,
  perPersonDetails: PerPersonDetails,
  groupMentionRef?: number
) => {
  const count = Object.values(perPersonDetails).flatMap((_) => _.items).length;
  if (count === 0) {
    throw new Error("No items to email about");
  }
  console.log(
    `Sending email to ${email} about ${count} ${
      groupMentionRef ? "group mention (instant)" : "missed mentions"
    }`
  );

  const emailHTML = buildEmailHTML(perPersonDetails, !!groupMentionRef);

  const subject = groupMentionRef
    ? `📌 Your team has just been mentioned in Pinboard (ref:${groupMentionRef})`
    : `📌 You might have missed ${count} message${
        count > 1 ? "s" : ""
      } in Pinboard (ref: ${Date.now()})`; //TODO find an alternate way to prevent threading for missed individual mentions

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
          Data: subject,
        },
        Body: {
          Text: { Data: getBasicMessage(!!groupMentionRef) },
          Html: { Data: emailHTML },
        },
      },
    })
  );
};
