import {
  DatabaseUniqueUserResponse,
  GrafanaRequest,
} from "../../../shared/types/grafanaType";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../../shared/awsIntegration";
import { Stage } from "../../../shared/types/stage";

export const getMetrics = async (
  request: GrafanaRequest
): Promise<DatabaseUniqueUserResponse[]> => {
  const stage = (process.env.STAGE as Stage) || "CODE";
  const lambda = new AWS.Lambda(standardAwsConfig);
  const response = await lambda
    .invoke({
      FunctionName: `pinboard-database-bridge-lambda-${stage}`,
      Payload: JSON.stringify(request),
    })
    .promise();

  return JSON.parse(response.Payload as string) as DatabaseUniqueUserResponse[];
};
