import {
  GrafanaRequest,
  Metric,
  MetricsResponse,
} from "../../../shared/types/grafanaType";
import * as AWS from "aws-sdk";
import { standardAwsConfig } from "../../../shared/awsIntegration";

const metricEndpointMap = {
  [Metric.UNIQUE_USERS_CODE]: "CODE",
  [Metric.UNIQUE_USERS_PROD]: "PROD",
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
          Payload: JSON.stringify({ range, target }),
        })
        .promise();
    })
  );
  return metricsResponse.map((response, index) => {
    JSON.parse(response.Payload as string);
    return {
      target: targets[index].target,
      datapoints: JSON.parse(response.Payload as string),
    };
  });
};
