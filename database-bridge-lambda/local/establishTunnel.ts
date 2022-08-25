import { DATABASE_PORT, getDatabaseProxyName } from "../../shared/database";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../shared/awsIntegration";
import { Stage } from "../../shared/types/stage";
import { exec } from "child_process";
import { promisify } from "util";

const runCommandPromise = promisify(exec);

export const establishTunnelToDBProxy = async (
  stage: Stage,
  instanceID: string
) => {
  const DBProxyName = getDatabaseProxyName(stage);

  const dbProxyResponse = await new AWS.RDS(standardAwsConfig)
    .describeDBProxies({ DBProxyName })
    .promise();

  const { Endpoint } = dbProxyResponse.DBProxies![0]!;

  console.log("Fetching SSH details...");

  const ssmResult = await runCommandPromise(
    `ssm ssh --profile workflow -i ${instanceID} --raw`
  );

  if (ssmResult.stderr?.trimEnd() || !ssmResult.stdout?.trimEnd()) {
    console.log(ssmResult.stdout);
    console.error(ssmResult.stderr);
    throw Error("Failed to establish get SSH command");
  }

  console.log("SSH details fetched, establishing SSH tunnel...");

  const sshCommand = ssmResult.stdout;

  const sshTunnelResult = await runCommandPromise(
    `${sshCommand} -L ${DATABASE_PORT}:${Endpoint}:${DATABASE_PORT} -N -f`
  );

  if (sshTunnelResult.stderr?.trimEnd() || !sshTunnelResult.stdout?.trimEnd()) {
    console.log(sshTunnelResult.stdout);
    console.error(sshTunnelResult.stderr);
    throw Error("Failed to establish SSH tunnel");
  }

  console.log(`SSH tunnel established on localhost:${DATABASE_PORT} 🎉`);
};
