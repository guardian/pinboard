import { createDatabaseTunnel } from "./databaseTunnel";
import { getDatabaseConnection } from "../databaseConnection";
import prompts from "prompts";
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
