import {
  GrafanaRequest,
  StageMetric,
  MetricsResponse,
  Metric,
} from "../../../shared/types/grafanaType";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../../shared/awsIntegration";

const metricEndpointMap = {
  [StageMetric.UNIQUE_USERS_CODE]: "CODE",
  [StageMetric.UNIQUE_USERS_PROD]: "PROD",
};

const stageMetricToMetric = {
  [StageMetric.UNIQUE_USERS_CODE]: Metric.UNIQUE_USERS,
  [StageMetric.UNIQUE_USERS_PROD]: Metric.UNIQUE_USERS,
};

export const getMetrics = async (
  request: GrafanaRequest
): Promise<MetricsResponse[]> => {
  const lambda = new AWS.Lambda(standardAwsConfig);
  const { range, targets } = request;
  const metricsResponse = await Promise.all(
    //FIXME perhaps allSettled here and then log unsuccessful attempts?
    targets.map((target) => {
      console.log(`processing grafana request`, target.target);
      return lambda
        .invoke({
          FunctionName: `pinboard-database-bridge-lambda-${
            metricEndpointMap[target.target]
          }`,
          Payload: JSON.stringify({
            range,
            metric: stageMetricToMetric[target.target],
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
