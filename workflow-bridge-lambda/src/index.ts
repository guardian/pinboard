import * as lambda from "aws-lambda";
import fetch from "node-fetch";

const WORKFLOW_DATASTORE_API_URL = process.env.WORKFLOW_DATASTORE_API_URL;

exports.handler = async (
  event: any, // TODO find the AppSync event type or define our own
  context: lambda.Context
) => {
  const stubsResponse = await fetch(
    `${WORKFLOW_DATASTORE_API_URL}/stubs?fieldFilter=minimal`
  );
  const stubsResponseBody = await stubsResponse.json();

  return stubsResponseBody.data.content;
};
