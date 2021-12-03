import fetch, { Response } from "node-fetch";
import { WorkflowStub } from "../../shared/graphql/graphql";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";

const WORKFLOW_DATASTORE_API_URL = `http://${getEnvironmentVariableOrThrow(
  "workflowDnsName"
)}/api`;

const FIELD_FILTER_QUERY_PARAM = `fieldFilter=${[
  "id",
  "title",
  "composerId",
].join(",")}`;

const DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

interface LambdaEvent {
  arguments?: {
    composerId?: string;
    relevanceThresholdInDays?: number;
  };
  identity: { resolverContext: { userEmail: string } };
}

exports.handler = async (event: LambdaEvent) => {
  if (event.arguments?.composerId) {
    return await getPinboardByComposerId(event.arguments.composerId);
  } else if (event.arguments?.relevanceThresholdInDays) {
    return await getRelevantPinboards(
      event.arguments.relevanceThresholdInDays,
      event.identity.resolverContext.userEmail
    );
  }

  return await getAllPinboards();
};

async function getPinboardByComposerId(composerId: string) {
  const contentResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/content/${composerId}`
  );
  const data = (await contentResponse.json()).data;
  return { ...data, status: data?.externalData?.status };
}

async function ungroupStubs(stubsResponse: Response) {
  const stubsResponseBody = await stubsResponse.json();
  const groupedStubs: { [status: string]: WorkflowStub[] } =
    stubsResponseBody.data.content;

  return Object.entries(groupedStubs).reduce(
    (accumulator, [status, stubs]) => [
      ...accumulator,
      ...stubs.map((stub) => ({ ...stub, status })),
    ],
    [] as WorkflowStub[]
  );
}

async function getRelevantPinboards(
  relevanceThresholdInDays: number,
  userEmail: string
) {
  const userParams = `touched=${userEmail}&assigneeEmail=${userEmail}`;

  const relevanceThresholdInMillis = relevanceThresholdInDays * DAY_IN_MILLIS;
  const now = new Date().getTime();
  const from = new Date(now - relevanceThresholdInMillis).toISOString();
  const until = new Date(now + relevanceThresholdInMillis).toISOString();
  const dateParams = `view.from=${from}&view.until=${until}`;

  return await ungroupStubs(
    await fetch(
      `${WORKFLOW_DATASTORE_API_URL}/stubs?${FIELD_FILTER_QUERY_PARAM}&${userParams}&${dateParams}`
    )
  );
}

async function getAllPinboards() {
  return await ungroupStubs(
    await fetch(
      `${WORKFLOW_DATASTORE_API_URL}/stubs?${FIELD_FILTER_QUERY_PARAM}`
    )
  );
}
