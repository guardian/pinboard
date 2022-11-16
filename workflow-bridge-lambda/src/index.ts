import fetch from "node-fetch";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { MAX_PINBOARDS_TO_DISPLAY } from "../../shared/constants";
import type { PinboardData } from "../../shared/graphql/extraTypes";
import * as ASCIIFolder from "fold-to-ascii";

const WORKFLOW_DATASTORE_API_URL = `http://${getEnvironmentVariableOrThrow(
  "workflowDnsName"
)}/api`;

exports.handler = async (event: {
  arguments?: { composerId?: string; ids?: string[]; searchText?: string };
}) => {
  if (event.arguments?.composerId) {
    return await getPinboardById("content")(event.arguments.composerId);
  }
  if (event.arguments?.ids) {
    return await Promise.all(event.arguments.ids.map(getPinboardById("stubs")));
  } else {
    return await getAllPinboards(event.arguments?.searchText);
  }
};

const getPinboardById = (apiBase: "content" | "stubs") => async (
  id: string
) => {
  const contentResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/${apiBase}/${id}`
  );
  if (contentResponse.status === 404) {
    return {
      id,
      isNotFound: true,
    };
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
    return {
      id,
      isNotFound: true,
    };
  }
  return { ...data.externalData, ...data };
};

const getAllPinboards = async (searchText?: string) => {
  const fields = ["id", "title", "composerId", "headline", "trashed"].join(",");

  const searchQueryParamClause = searchText
    ? `&text=${encodeURI(ASCIIFolder.foldMaintaining(searchText))}`
    : "";

  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubs?fieldFilter=${fields}&limit=${
      MAX_PINBOARDS_TO_DISPLAY + 1
    }${searchQueryParamClause}`
  );

  if (!stubsResponse.ok) {
    throw Error(`${stubsResponse.status} ${await stubsResponse.text()}`);
  }

  const stubsResponseBody = (await stubsResponse.json()) as {
    data: {
      content: { [status: string]: PinboardData[] };
    };
  };
  const groupedStubs = stubsResponseBody.data.content;

  return Object.entries(groupedStubs).reduce(
    (accumulator, [status, stubs]) => [
      ...accumulator,
      ...stubs.map((stub) => ({ ...stub, status })),
    ],
    [] as PinboardData[]
  );
};
