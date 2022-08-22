import { handler } from "./src";
import { ENVIRONMENT_VARIABLE_KEYS } from "../shared/environmentVariables";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../shared/awsIntegration";
import { getDatabaseProxyName } from "../shared/database";

const DBProxyName = getDatabaseProxyName("CODE");

new AWS.RDS(standardAwsConfig).describeDBProxies(
  { DBProxyName },
  (error, data) => {
    if (error || !data) {
      console.error(error);
      throw Error(`Could not find DB Proxy '${DBProxyName}'`);
    }
    const { Endpoint } = data!.DBProxies![0]!;

    process.env[ENVIRONMENT_VARIABLE_KEYS.databaseHostname] = Endpoint;

    handler({ field: "listItems", arguments: {} })
      .then(JSON.stringify)
      .then(console.log)
      .catch(console.error);
  }
);
