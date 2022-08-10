import { handler } from "./src";
import { Item } from "../shared/graphql/graphql";
import { SQSRecord } from "aws-lambda";

const item: Item = {
  pinboardId: "63923",
  payload: null,
  mentions: ["tom.richards@guardian.co.uk"],
  userEmail: "tom.richards@guardian.co.uk",
  id: "535b86e2-4f01-4f60-a2d0-a5e4f5a7d312",
  message: "testing one two three",
  type: "message-only",
  timestamp: "1630517452",
};

handler({
  Records: [
    {
      body: JSON.stringify(item),
    } as SQSRecord, // casting here to avoid populating loads of fields of SQSRecord which are not used by the handler
  ],
});
