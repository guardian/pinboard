import { getDatabaseConnection } from "shared/database/databaseConnection";
import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { getWorkflowBridgeLambdaFunctionName } from "shared/constants";
import { Stage } from "shared/types/stage";
import { WorkflowStub } from "shared/graphql/graphql";
import { Lambda } from "@aws-sdk/client-lambda";
import { sendEmail } from "./sendEmail";
import { PerPersonDetails } from "./email";

interface FinalStructure {
  [email: string]: PerPersonDetails;
}

const lambda = new Lambda(standardAwsConfig);

export const handler = async () => {
  const sql = await getDatabaseConnection();

  try {
    // find unread mentions (individual and group) older than X (which haven't already been emailed about)
    const itemsToEmailAbout = await sql`
        SELECT "id", "message", "payload", "timestamp", "pinboardId", (
            SELECT json_agg("userEmail")
            FROM "LastItemSeenByUser"
            WHERE "LastItemSeenByUser"."pinboardId" = "Item"."pinboardId"
              AND "LastItemSeenByUser"."userEmail" = ANY("Item"."mentions")
              AND "LastItemSeenByUser"."itemID" < "Item"."id"
        ) AS "unreadMentions"
        FROM "Item"
        WHERE "mentions" IS NOT NULL 
          AND "isEmailEvaluated" IS FALSE
          AND "timestamp" < (NOW() - INTERVAL '1 hour')
    `;
    //TODO group mentions

    if (itemsToEmailAbout.length === 0) {
      console.log("No items to email about");
      return;
    }

    const pinboardIds = new Set<string>(
      itemsToEmailAbout.map(({ pinboardId }) => pinboardId)
    );

    const workflowLookupRequestPayload = {
      arguments: { ids: [...pinboardIds] },
    };

    // lookup working titles & headlines for all the Pinboard IDs
    const workflowDetails: WorkflowStub[] = JSON.parse(
      Buffer.from(
        (
          await lambda.invoke({
            FunctionName: getWorkflowBridgeLambdaFunctionName(STAGE as Stage),
            Payload: Buffer.from(JSON.stringify(workflowLookupRequestPayload)),
          })
        ).Payload!
      ).toString()
    );

    const workflowLookup = workflowDetails.reduce(
      (acc, workflowStub) => ({
        ...acc,
        [workflowStub.id]: workflowStub,
      }),
      {} as { [id: string]: WorkflowStub }
    );

    // group by email address and then pinboard ID (so we can send one email per person, with all the missed mentions for each pinboard)
    const finalStructure: FinalStructure = itemsToEmailAbout.reduce(
      (
        outerAcc: FinalStructure,
        { id, message, payload, timestamp, pinboardId, unreadMentions }
      ) =>
        unreadMentions?.reduce(
          (innerAcc: FinalStructure, email: string) => ({
            ...innerAcc,
            [email]: {
              ...(innerAcc[email] || {}),
              [pinboardId]: workflowLookup[pinboardId] && {
                ...(innerAcc[email]?.[pinboardId] || {}),
                headline: workflowLookup[pinboardId]?.headline,
                workingTitle: workflowLookup[pinboardId]?.title,
                items: [
                  ...(innerAcc[email]?.[pinboardId]?.items || []),
                  {
                    id,
                    message,
                    thumbnail:
                      (payload && JSON.parse(payload)?.thumbnail) || null,
                    timestamp: new Date(timestamp), // TODO improve timezone locality before displaying in emails
                  },
                ],
              },
            },
          }),
          outerAcc
        ) || outerAcc,
      {} as FinalStructure
    );

    for (const [email, perPersonDetails] of Object.entries(finalStructure)) {
      await sendEmail(email, perPersonDetails).catch(console.error); // TODO log the item IDs that failed to send, so their `isEmailEvaluated` could be reset to false
    }

    // mark those items as evaluated, so we don't email about them again
    await sql`
        UPDATE "Item"
        SET "isEmailEvaluated" = TRUE
        WHERE "id" IN ${sql(itemsToEmailAbout.map(({ id }) => id))}
    `;
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await sql.end();
  }
};
