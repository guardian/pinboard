import fetch from "node-fetch";
import { getEnvironmentVariableOrThrow } from "../../shared/environmentVariables";
import { MAX_PINBOARDS_TO_DISPLAY } from "../../shared/constants";
import type { PinboardData } from "../../shared/graphql/extraTypes";

const WORKFLOW_DATASTORE_API_URL = `http://${getEnvironmentVariableOrThrow(
  "workflowDnsName"
)}/api`;

const fields = [
  "id",
  "title",
  "composerId",
  "headline",
  "trashed",
  "path",
].join(",");

interface StubsResponseBody {
  data: {
    content: { [status: string]: PinboardData[] };
  };
}

interface Arguments {
  composerId?: string;
  ids?: string[];
  searchText?: string;
  paths?: string[];
}

exports.handler = async (event: { arguments?: Arguments }) => {
  if (event.arguments?.composerId) {
    return await getPinboardById("content")(event.arguments.composerId);
  }
  if (event.arguments?.ids) {
    // TODO do this in single call using new endpoint added in https://github.com/guardian/workflow/pull/1119
    return await Promise.all(
      event.arguments.ids
        .map(parseFloat) // workflow IDs are Longs
        .map(getPinboardById("stubs"))
    );
  }
  if (event.arguments?.paths !== undefined) {
    return await getPinboardsByPaths(event.arguments?.paths);
  }
  if (event.arguments?.searchText !== undefined) {
    return await getAllPinboards(event.arguments?.searchText);
  }
  return [
    ...(await getAllPinboardIds({ isTrashed: false })),
    ...(await getAllPinboardIds({ isTrashed: true })),
  ];
};

const getPinboardById =
  (apiBase: "content" | "stubs") => async (id: string | number) => {
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
    const data = (
      (await contentResponse.json()) as {
        data: {
          externalData: {
            status: string;
          };
          // there are other fields, but they're just being forwarded on
        };
      }
    ).data;
    if (!data) {
      return {
        id,
        isNotFound: true,
      };
    }
    return { ...data.externalData, ...data };
  };

const getPinboardsByPaths = async (identifiers: number[] | string[]) => {
  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubsByPath?fieldFilter=${fields}`,
    {
      method: "POST",
      body: JSON.stringify(identifiers),
    }
  );

  if (!stubsResponse.ok) {
    throw Error(`${stubsResponse.status} ${await stubsResponse.text()}`);
  }

  const stubsResponseBody = (await stubsResponse.json()) as StubsResponseBody;

  return Object.values(stubsResponseBody.data.content).flat();
};

const getAllPinboardIds = async ({ isTrashed }: { isTrashed: boolean }) => {
  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubs?fieldFilter=id&trashed=${isTrashed}`
  );

  if (!stubsResponse.ok) {
    throw Error(`${stubsResponse.status} ${await stubsResponse.text()}`);
  }

  const stubsResponseBody = (await stubsResponse.json()) as StubsResponseBody;

  return Object.values(stubsResponseBody.data.content)
    .flat()
    .map((_) => _.id);
};

const getAllPinboards = async (searchText?: string) => {
  const searchQueryParamClause = searchText
    ? `&text=${encodeURI(searchText)}`
    : "";

  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubs?fieldFilter=${fields}&limit=${
      MAX_PINBOARDS_TO_DISPLAY + 1
    }${searchQueryParamClause}`
  );

  if (!stubsResponse.ok) {
    throw Error(`${stubsResponse.status} ${await stubsResponse.text()}`);
  }

  const stubsResponseBody = (await stubsResponse.json()) as StubsResponseBody;

  return Object.entries(stubsResponseBody.data.content).reduce(
    (accumulator, [status, stubs]) => [
      ...accumulator,
      ...stubs.map((stub) => ({ ...stub, status })),
    ],
    [] as PinboardData[]
  );
};
