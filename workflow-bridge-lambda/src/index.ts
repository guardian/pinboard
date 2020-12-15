import * as lambda from "aws-lambda";
import fetch from "node-fetch";

exports.handler = async (
  event: any, // TODO find the AppSync event type or define our own
  context: lambda.Context
) => {
  const datastoreAPI = process.env.DATASTORE;
  const stubsResponse = await fetch(
    `${datastoreAPI}/stubs?fieldFilter=minimal`
  );
  const stubsResponseBody = await stubsResponse.json();

  return stubsResponseBody.data.content;
};
