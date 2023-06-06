import { getDatabaseConnection } from "shared/database/databaseConnection";
import { STAGE, standardAwsConfig } from "shared/awsIntegration";
import { getWorkflowBridgeLambdaFunctionName } from "shared/constants";
import { Stage } from "shared/types/stage";
import { WorkflowStub } from "shared/graphql/graphql";
import { Lambda } from "@aws-sdk/client-lambda";
import { sendEmail } from "./sendEmail";
import { PerPersonDetails } from "./email";
import { Sql } from "shared/database/types";

interface FinalStructure {
  [email: string]: PerPersonDetails;
}

const lambda = new Lambda(standardAwsConfig);

function getItemsToEmailAbout(
  sql: Sql,
  itemIdWithGroupMention: number | undefined
) {
  return itemIdWithGroupMention
    ? sql`
      SELECT "id", "type", "message", "payload", "timestamp", "pinboardId", "firstName", "lastName", "avatarUrl", (
          SELECT json_agg("primaryEmail")
          FROM "Group"
          WHERE "Group"."shorthand" = ANY("Item"."groupMentions")
      ) AS "emails"
      FROM "Item" LEFT JOIN "User" ON "Item"."userEmail" = "User"."email"
      WHERE "id" = ${itemIdWithGroupMention}
  `
    : sql`
      SELECT "id", "type", "message", "payload", "timestamp", "pinboardId", "firstName", "lastName", "avatarUrl", (
          SELECT json_agg("mentionEmail")
          FROM unnest("mentions") as "mentionEmail"
          WHERE NOT EXISTS( /* this approach captures BOTH when the last thing they saw was before the mention in question AND when they've never seen the pinboard at all */
              SELECT 1
              FROM "LastItemSeenByUser"
              WHERE "LastItemSeenByUser"."pinboardId" = "Item"."pinboardId"
                AND "LastItemSeenByUser"."userEmail" = "mentionEmail"
                AND "LastItemSeenByUser"."itemID" >= "Item"."id"
          )
      ) AS "emails"
      FROM "Item" LEFT JOIN "User" ON "Item"."userEmail" = "User"."email"
      WHERE "mentions" != '{}' /* i.e. not empty */
        AND "mentions" IS NOT NULL
        AND "isEmailEvaluated" IS FALSE
        AND "timestamp" < (NOW() - INTERVAL '1 hour')
  `;
}

export const handler = async (maybeSendImmediatelyDetail?: {
  itemId: number;
  maybeRelatedItemId?: number;
}) => {
  const itemIdWithGroupMention = maybeSendImmediatelyDetail?.itemId;
  const groupMentionRef =
    maybeSendImmediatelyDetail?.maybeRelatedItemId || itemIdWithGroupMention; // this ensures threading (i.e. claim ends up as reply to the original email)

  const sql = await getDatabaseConnection();

  try {
    const itemsToEmailAbout = await getItemsToEmailAbout(
      sql,
      itemIdWithGroupMention
    );

    if (!itemsToEmailAbout.some((_) => _.emails && _.emails.length > 0)) {
      console.log("No items to email about");
      /*
       * not returning early here, because any items in itemsToEmailAbout
       * will need their isEmailEvaluated flag set to true at the bottom
       * of this file, so they aren't continually picked up
       */
    }

    if (itemsToEmailAbout.length === 0) {
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
        { payload, timestamp, pinboardId, emails, ...itemFragment }
      ) =>
        emails?.reduce(
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
                    ...itemFragment,
                    thumbnailURL: payload?.thumbnail || null,
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
      await sendEmail(email, perPersonDetails, groupMentionRef).catch((error) =>
        console.error(
          `Failed to send email to ${email}, which contained items with IDs:`,
          Object.values(perPersonDetails).map((_) => _.items.map((_) => _.id)),
          itemIdWithGroupMention
            ? ""
            : "If you need to resend, you can manually reset the 'isEmailEvaluated' cell for these IDs in the Item table in the database",
          error
        )
      );
    }

    // mark those items as evaluated, so we don't email about them again
    if (!itemIdWithGroupMention) {
      await sql`
        UPDATE "Item"
        SET "isEmailEvaluated" = TRUE
        WHERE "id" IN ${sql(itemsToEmailAbout.map(({ id }) => id))}
    `;
    }
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await sql.end();
  }
};
