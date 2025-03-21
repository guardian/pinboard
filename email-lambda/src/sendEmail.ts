import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { getBasicMessage, buildEmailHTML, EmailData } from "./email";

const emailer = new SESClient(standardAwsConfig);

export const sendEmail = async ({
  email,
  emailData,
  isIndividualMentionEmail,
  ref,
}: {
  email: string;
  emailData: EmailData;
  isIndividualMentionEmail: boolean;
  ref: number;
}) => {
  console.log(
    `Sending email to ${email} about ${
      isIndividualMentionEmail ? "an individual" : "a group"
    } mention.`
  );

  const emailHTML = buildEmailHTML(emailData, !!ref);

  const subject = `📌 ${
    isIndividualMentionEmail ? "You've" : "Your team has"
  } just been mentioned in Pinboard (ref:${ref})`;

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
          Text: { Data: getBasicMessage(!!ref) },
          Html: { Data: emailHTML },
        },
      },
    })
  );
};
