import { getDatabaseConnection } from "shared/database/databaseConnection";
import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { getWorkflowBridgeLambdaFunctionName } from "shared/constants";
import { Stage } from "shared/types/stage";
import { WorkflowStub } from "shared/graphql/graphql";
import { Lambda } from "@aws-sdk/client-lambda";
import { sendEmail } from "./sendEmail";
import { EmailData } from "./email";

const lambda = new Lambda(standardAwsConfig);

export const handler = async ({
  itemId,
  maybeRelatedItemId,
}: {
  itemId: number;
  maybeRelatedItemId?: number;
}) => {
  const ref = maybeRelatedItemId || itemId; // this ensures threading (i.e. claim ends up as reply to the original email)

  const sql = await getDatabaseConnection();

  try {
    // wait 5 seconds to ensure the item has been written to the database fully
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const itemToEmailAbout = (
      await sql`
      SELECT "id", "type", "message", "payload", "timestamp", "pinboardId", "Item"."userEmail", "firstName", "lastName", "avatarUrl", "mentions" as "individualMentionEmails", (
          SELECT json_agg("primaryEmail")
          FROM "Group"
          WHERE "Group"."shorthand" = ANY("Item"."groupMentions")
      ) AS "groupMentionEmails"
      FROM "Item" LEFT JOIN "User" ON "Item"."userEmail" = "User"."email"
      WHERE "id" = ${itemId}
  `
    )[0] as {
      id: string;
      type: string;
      message: string;
      payload: { thumbnail: string } | null;
      timestamp: string;
      pinboardId: string;
      userEmail: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      individualMentionEmails: string[] | null;
      groupMentionEmails: string[] | null;
    };

    if (!itemToEmailAbout) {
      throw new Error("No items found with ID " + itemId);
    }

    const pinboardId = parseInt(itemToEmailAbout.pinboardId);

    if (!pinboardId) {
      throw new Error(
        `Pinboard ID (${itemToEmailAbout.pinboardId}) could not be found for item with ID ${itemId}`
      );
    }

    // lookup working title & headline for the Pinboard ID
    const workflowDetail: WorkflowStub = JSON.parse(
      Buffer.from(
        (
          await lambda.invoke({
            FunctionName: getWorkflowBridgeLambdaFunctionName(STAGE as Stage),
            Payload: Buffer.from(
              JSON.stringify({
                arguments: { ids: [pinboardId] },
              })
            ),
          })
        ).Payload!
      ).toString()
    )[0];

    if (!workflowDetail) {
      throw new Error(
        `Failed to get workflow detail for pinboard ID ${pinboardId}`
      );
    }

    if (!workflowDetail.title) {
      throw new Error(`No workflow title for pinboard ID ${pinboardId}`);
    }

    const perPersonDetails: EmailData = {
      ...itemToEmailAbout,
      headline: workflowDetail.headline,
      workingTitle: workflowDetail.title,
      thumbnailURL: itemToEmailAbout.payload?.thumbnail || null,
      timestamp: new Date(itemToEmailAbout.timestamp), // TODO improve timezone locality before displaying in emails
    };

    const emails = (itemToEmailAbout.individualMentionEmails || []).concat(
      itemToEmailAbout.groupMentionEmails || []
    );

    for (const email of emails) {
      await sendEmail({
        email,
        emailData: perPersonDetails,
        isIndividualMentionEmail:
          !!itemToEmailAbout.individualMentionEmails?.includes(email),
        ref,
      }).catch((error) =>
        console.error(
          `Failed to send email to ${email} for item ${itemId} in pinboard ${pinboardId}`,
          error
        )
      );
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
