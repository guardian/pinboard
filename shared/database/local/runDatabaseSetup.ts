import { createDatabaseTunnel } from "./databaseTunnel";
import { getDatabaseConnection } from "../databaseConnection";
import prompts from "prompts";
import {
  getEmailLambdaFunctionName,
  getNotificationsLambdaFunctionName,
} from "../../constants";
import {
  EMAIL_DATABASE_TRIGGER_NAME,
  NOTIFICATIONS_DATABASE_TRIGGER_NAME,
} from "../database";
import { AWS_REGION } from "../../awsRegion";

import { readFileSync } from "fs";
import { Sql } from "../types";
import * as path from "path";

const runSetupSqlFile = (sql: Sql, fileName: string) =>
  sql.file(path.join("./shared/database/local/setup", fileName));

const runSetupTriggerSqlFile = (
  sql: Sql,
  fileName: string,
  functionName: string,
  triggerName: string
) =>
  sql.unsafe(
    // TODO ideally we could do this with sql.file() but it doesn't seem to work
    readFileSync(path.join("./shared/database/local/setup", fileName), "utf8")
      .replace("$lambdaFunctionName", functionName)
      .replace("$awsRegion", AWS_REGION)
      .replace("$triggerName", triggerName)
      .replace("$triggerName", triggerName)
  );

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
    "create/update 'after insert' trigger on Item table (to invoke notifications-lambda if applicable)":
      () =>
        runSetupTriggerSqlFile(
          sql,
          "007-TriggerNotificationsLambdaAfterItemInsert.sql",
          getNotificationsLambdaFunctionName(stage),
          NOTIFICATIONS_DATABASE_TRIGGER_NAME
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
    "add visitedTourSteps column to User table": () =>
      runSetupSqlFile(sql, "017-AddVisitedTourStepsColumnToUserTable.sql"),
    "add isEmailEvaluated column to Item table": () =>
      runSetupSqlFile(sql, "018-AddIsEmailEvaluatedColumnToItemTable.sql"),
    "create/update 'after insert' trigger on Item table (to invoke email-lambda if applicable)":
      () =>
        runSetupTriggerSqlFile(
          sql,
          "019-TriggerEmailLambdaAfterItemInsert.sql",
          getEmailLambdaFunctionName(stage),
          EMAIL_DATABASE_TRIGGER_NAME
        ),
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
