import { createDatabaseTunnel } from "./databaseTunnel";
import { getDatabaseConnection } from "../databaseConnection";
import prompts from "prompts";
import { getNotificationsLambdaFunctionName } from "../../constants";
import { NOTIFICATIONS_DATABASE_TRIGGER_NAME } from "../database";
import { AWS_REGION } from "../../awsRegion";

import { readFileSync } from "fs";
import { Sql } from "../types";
import * as path from "path";

const runSetupSqlFile = (sql: Sql, fileName: string) =>
  sql.file(path.join("./shared/database/local/setup", fileName));

(async () => {
  const stage: "CODE" | "PROD" = await createDatabaseTunnel();

  const sql = await getDatabaseConnection();

  const steps = {
    "create Item table": () => runSetupSqlFile(sql, "001-ItemTable.sql"),
    "create Item table index": () => runSetupSqlFile(sql, "002-ItemIndex.sql"),
    "create LastItemSeenByUser table": () =>
      runSetupSqlFile(sql, "003-LastItemSeenByUserTable.sql"),
    "create LastItemSeenByUser table index": () =>
      runSetupSqlFile(sql, "004-LastItemSeenByUserIndex.sql"),
    "create User table": () => runSetupSqlFile(sql, "005-UserTable.sql"),
    "enable Lambda invocation from within RDS DB": () =>
      runSetupSqlFile(sql, "006-EnableLambdaInvocation.sql"),
    "create/update 'after insert' trigger on Item table (to invoke notifications-lambda if applicable)": async () =>
      // TODO ideally we could do this with sql.file() but it doesn't seem to work
      sql.unsafe(
        readFileSync(
          "./shared/database/local/setup/007-TriggerNotificationsLambdaAfterItemInsert.sql",
          "utf8"
        )
          .replace(
            "$notificationLambdaFunctionName",
            getNotificationsLambdaFunctionName(stage)
          )
          .replace("$awsRegion", AWS_REGION)
          .replace("$triggerName", NOTIFICATIONS_DATABASE_TRIGGER_NAME)
          .replace("$triggerName", NOTIFICATIONS_DATABASE_TRIGGER_NAME)
      ),
    "add googleID column to User table": () =>
      runSetupSqlFile(sql, "008-AddGoogleIDToUserTable.sql"),
    "create Group table": () => runSetupSqlFile(sql, "009-GroupTable.sql"),
    "create GroupMember table": () =>
      runSetupSqlFile(sql, "010-GroupMemberTable.sql"),
    "add groupMentions column to Item table": () =>
      runSetupSqlFile(sql, "011-AddGroupMentionsToItemTable.sql"),
    "add claimedByEmail and claimable columns to Item table": () =>
      runSetupSqlFile(sql, "012-AddClaimColumnsToItemTable.sql"),
    "add relatedItemId column to Item table": () =>
      runSetupSqlFile(sql, "013-AddRelatedItemIdColumnToItemTable.sql"),
    "add index to User table on googleID": () =>
      runSetupSqlFile(sql, "014-AddUserGoogleIdIndex.sql"),
    "add editHistory and deletedAt columns to Item table": () =>
      runSetupSqlFile(sql, "015-AddEditAndDeleteColumnsToItemTable.sql"),
    "add isArchived column to Item table": () =>
      runSetupSqlFile(sql, "016-AddIsArchivedColumnToItemTable.sql"),
  };

  const allSteps = async () => {
    for (const [stepName, runStep] of Object.entries(steps)) {
      console.log(stepName);
      console.log(await runStep());
      console.log();
    }
    return "done";
  };

  const { stepToRun } = await prompts({
    type: "select",
    name: "stepToRun",
    message: "Which setup step?",
    choices: [
      { title: "ALL", value: allSteps, selected: true },
      ...Object.entries(steps).map(([title, value]) => ({
        title,
        value,
      })),
    ],
  });

  console.log(await stepToRun());
})();
