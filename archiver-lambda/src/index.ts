import { getDatabaseConnection } from "../../shared/database/databaseConnection";
import { getWorkflowBridgeLambdaFunctionName } from "../../shared/constants";
import { STAGE, standardAwsConfig } from "../../shared/awsIntegration";
import { Stage } from "../../shared/types/stage";
import { Lambda } from "@aws-sdk/client-lambda";

const lambda = new Lambda(standardAwsConfig);

export const handler = async () => {
  const sql = await getDatabaseConnection();

  try {
    const activeWorkflowIds: string[] = JSON.parse(
      Buffer.from(
        (
          await lambda.invoke({
            FunctionName: getWorkflowBridgeLambdaFunctionName(STAGE as Stage),
          })
        ).Payload!
      ).toString()
    );

    console.log(`Active workflow items: ${activeWorkflowIds.length}`);

    if (activeWorkflowIds.length < 10) {
      throw Error("Too few active workflow items, smells fishy!");
    }

    const itemIdsUpdated = (
      await sql`
        UPDATE "Item"
        SET "isArchived" = true,
            "message" = NULL,
            "payload" = NULL
        WHERE "isArchived" = false
          AND "pinboardId" NOT IN ${sql(activeWorkflowIds)}
        RETURNING id
    `
    ).map(({ id }) => id);
    console.log(
      `Archived ${itemIdsUpdated.length} items - with IDs:`,
      itemIdsUpdated
    );

    await sql.begin(async (sql) => {
      const usersToBeUpdatedMap = (
        await sql`
        SELECT "email", ARRAY(
            SELECT *
            FROM unnest("manuallyOpenedPinboardIds")
            WHERE UNNEST NOT IN ${sql(activeWorkflowIds)}
        ) as "toBeRemoved"
        FROM "User"
        WHERE "manuallyOpenedPinboardIds" IS NOT NULL
    `
      ).reduce(
        (acc, { email, toBeRemoved }) =>
          toBeRemoved.length > 0
            ? {
                ...acc,
                [email]: toBeRemoved,
              }
            : acc,
        {}
      );
      const emailsOfUsersToBeUpdated = Object.keys(usersToBeUpdatedMap);
      if (emailsOfUsersToBeUpdated.length === 0) {
        console.log(
          "No users need their 'manuallyOpenedPinboardIds' to be updated"
        );
        return;
      }
      console.log(
        `Removing the following archived pinboards from the 'manuallyOpenedPinboardIds' of ${emailsOfUsersToBeUpdated.length} users:`,
        usersToBeUpdatedMap
      );

      const usersActuallyUpdated = await sql`
        UPDATE "User"
        SET "manuallyOpenedPinboardIds" = ARRAY(
            SELECT *
            FROM unnest("manuallyOpenedPinboardIds")
            WHERE UNNEST IN ${sql(activeWorkflowIds)}
        )
        WHERE "email" IN ${sql(emailsOfUsersToBeUpdated)}
    `;
      console.log(
        `Removed archived pinboards from the 'manuallyOpenedPinboardIds' of ${usersActuallyUpdated.count} users`
      );
      if (emailsOfUsersToBeUpdated.length !== usersActuallyUpdated.count) {
        // throw here to rollback this transaction
        throw Error(
          `ROLLBACK: the number of users to be updated (${emailsOfUsersToBeUpdated.length}) does not match the number of users actually updated (${usersActuallyUpdated.count})`
        );
      }
    });
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await sql.end();
  }
};
