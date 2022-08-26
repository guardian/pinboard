import { DATABASE_PORT } from "../../shared/database";
import { Stage } from "../../shared/types/stage";
import { exec } from "child_process";
import { promisify } from "util";

const runCommandPromise = promisify(exec);

export const isThereExistingTunnel = async (
  dbProxyEndpoint: string
): Promise<boolean> => {
  const existingTunnelProcessResult = await runCommandPromise(
    `ps -ef | grep ssh | grep 5432 | grep -v grep || true`
  );

  if (existingTunnelProcessResult.stderr?.trim()) {
    console.log(existingTunnelProcessResult.stdout);
    console.error(existingTunnelProcessResult.stderr);
    throw Error("Failed to lookup any existing tunnels");
  }

  if (existingTunnelProcessResult.stdout.includes(dbProxyEndpoint)) {
    return true;
  } else if (
    existingTunnelProcessResult.stdout.trim().length > 0 &&
    !existingTunnelProcessResult.stdout.includes(dbProxyEndpoint)
  ) {
    console.log(existingTunnelProcessResult.stdout);
    console.error(existingTunnelProcessResult.stderr);
    throw Error(
      `It looks like there is an existing tunnel on localhost:${DATABASE_PORT} but not to ${dbProxyEndpoint}.
       You will need to kill this manually.`
    );
  }

  return false;
};

export const establishTunnelToDBProxy = async (
  stage: Stage,
  instanceID: string,
  dbProxyEndpoint: string
) => {
  console.log("Fetching SSH details...");

  const ssmResult = await runCommandPromise(
    `ssm ssh --profile workflow -i ${instanceID} --raw`
  );

  if (ssmResult.stderr?.trim() || !ssmResult.stdout?.trim()) {
    console.log(ssmResult.stdout);
    console.error(ssmResult.stderr);
    throw Error("Failed to establish get SSH command");
  }

  console.log("SSH details fetched, establishing SSH tunnel...");

  const sshCommand = ssmResult.stdout;

  // ssh doesn't seem to play nicely with 'exec' so we have to fire and forget then check if the tunnel is established
  runCommandPromise(
    `${sshCommand} -L ${DATABASE_PORT}:${dbProxyEndpoint}:${DATABASE_PORT} -N -f -o ExitOnForwardFailure=yes`
  ).catch(console.error);

  await new Promise((resolve) => setTimeout(resolve, 7500)); // wait before checking the if the tunnel is established

  if (await isThereExistingTunnel(dbProxyEndpoint)) {
    console.log(`SSH tunnel established on localhost:${DATABASE_PORT} 🎉`);
  } else {
    throw Error("Failed to establish SSH tunnel");
  }
};