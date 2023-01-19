import {
  GrafanaRequest,
  StageMetric,
  MetricsResponse,
  Metric,
} from "../../../shared/types/grafanaType";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../../shared/awsIntegration";
import { getDatabaseBridgeLambdaFunctionName } from "../../../shared/constants";
import { Stage } from "../../../shared/types/stage";

const metricEndpointMap: Record<string, Stage> = {
  [StageMetric.UNIQUE_USERS_CODE]: "CODE",
  [StageMetric.UNIQUE_USERS_PROD]: "PROD",
};

export const getMetrics = async (
  request: GrafanaRequest
): Promise<MetricsResponse[]> => {
  const lambda = new AWS.Lambda(standardAwsConfig);
  const { range, targets } = request;
  const metricsResponse = await Promise.all(
    targets.map(({ target, data }) => {
      console.log(`processing grafana request`, target);
      return lambda
        .invoke({
          FunctionName: getDatabaseBridgeLambdaFunctionName(
            data?.stage || metricEndpointMap[target]
          ),
          Payload: JSON.stringify({
            range,
            metric: Metric.UNIQUE_USERS,
          }),
        })
        .promise();
    })
  );
  return metricsResponse.map((response, index) => ({
    target: targets[index].target,
    datapoints: JSON.parse(response.Payload as string),
  }));
};
