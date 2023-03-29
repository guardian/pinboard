import {
  GrafanaRequest,
  StageMetric,
  MetricsResponse,
  Metric,
} from "../../../shared/types/grafanaType";
import { Lambda } from "@aws-sdk/client-lambda";
import { standardAwsConfig } from "../../../shared/awsIntegration";
import { getDatabaseBridgeLambdaFunctionName } from "../../../shared/constants";
import { Stage } from "../../../shared/types/stage";

const metricEndpointMap: Record<string, Stage> = {
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
  const lambda = new Lambda(standardAwsConfig);
  const { range, targets } = request;
  const metricsResponse = await Promise.all(
    targets.map((target) => {
      console.log(`processing grafana request`, target.target);
      return lambda.invoke({
        FunctionName: getDatabaseBridgeLambdaFunctionName(
          metricEndpointMap[target.target]
        ),
        Payload: Buffer.from(
          JSON.stringify({
            range,
            metric: stageMetricToMetric[target.target],
          })
        ),
      });
    })
  );
  return metricsResponse.map((response, index) => ({
    target: targets[index].target,
    datapoints: JSON.parse(Buffer.from(response.Payload!).toString()),
  }));
};
