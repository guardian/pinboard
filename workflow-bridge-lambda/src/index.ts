import fetch from "node-fetch";
import { WorkflowStub } from "../../shared/graphql/graphql";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";

const WORKFLOW_DATASTORE_API_URL = `http://${getEnvironmentVariableOrThrow(
  "workflowDnsName"
)}/api`;

exports.handler = async (event: { arguments?: { composerId?: string } }) => {
  return await (event.arguments?.composerId
    ? getPinboardByComposerId(event.arguments?.composerId)
    : getAllPinboards());
};

async function getPinboardByComposerId(composerId: string) {
  const contentResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/content/${composerId}`
  );
  if (contentResponse.status === 404) {
    return null;
  }
  if (!contentResponse.ok) {
    throw Error(`${contentResponse.status} ${await contentResponse.text()}`);
  }
  const data = ((await contentResponse.json()) as {
    data: {
      externalData: {
        status: string;
      };
      // there are other fields, but they're just being forwarded on
    };
  }).data;
  if (!data) {
    return null;
  }
  return { ...data, status: data.externalData?.status };
}

async function getAllPinboards() {
  const fields = ["id", "title", "composerId"].join(",");

  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubs?fieldFilter=${fields}`
  );

  if (!stubsResponse.ok) {
    throw Error(`${stubsResponse.status} ${await stubsResponse.text()}`);
  }

  const stubsResponseBody = (await stubsResponse.json()) as {
    data: {
      content: { [status: string]: WorkflowStub[] };
    };
  };
  const groupedStubs = stubsResponseBody.data.content;

  return Object.entries(groupedStubs).reduce(
    (accumulator, [status, stubs]) => [
      ...accumulator,
      ...stubs.map((stub) => ({ ...stub, status })),
    ],
    [] as WorkflowStub[]
  );
}
