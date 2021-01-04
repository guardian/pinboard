import * as lambda from "aws-lambda";
import fetch from "node-fetch";

const WORKFLOW_DATASTORE_API_URL = `http://${process.env.WORKFLOW_DATASTORE_LOAD_BALANCER_DNS_NAME}/api`;

exports.handler = async (
  event: { arguments?: { composerId?: string } },
  context: lambda.Context
) => {
  return await (event.arguments?.composerId
    ? getPinboardByComposerId(event.arguments?.composerId)
    : getAllPinboards());
};

async function getPinboardByComposerId(composerId: string) {
  const contentResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/content/${composerId}`
  );
  const data = (await contentResponse.json()).data;
  return { ...data, status: data?.externalData?.status };
}

async function getAllPinboards() {
  const fields = ["id", "title", "composerId"].join(",");

  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubs?fieldFilter=${fields}`
  );
  const stubsResponseBody = await stubsResponse.json();
  const groupedStubs: { [status: string]: object[] } =
    stubsResponseBody.data.content;

  return Object.entries(groupedStubs).reduce(
    (accumulator, [status, stubs]) => [
      ...accumulator,
      ...stubs.map((stub) => ({ ...stub, status })),
    ],
    [] as object[]
  );
}
