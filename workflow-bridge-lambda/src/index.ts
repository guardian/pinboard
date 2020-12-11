import * as lambda from "aws-lambda";

exports.handler = async (
  event: any, // TODO find the AppSync event type or define our own
  context: lambda.Context
) => {
  const workflowItems = [
    { id: 1, title: "foo" },
    { id: 2, title: "bar" },
    { id: 3, title: "baz" },
  ];
  return workflowItems;
};
