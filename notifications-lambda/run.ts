import { handler } from "./src";

handler({
  Records: [
    {
      dynamodb: {
        NewImage: {
          pinboardId: { S: "63923" },
          payload: { NULL: true },
          mentions: { L: [{ S: "tom.richards@guardian.co.uk" }] },
          userEmail: { S: "tom.richards@guardian.co.uk" },
          id: { S: "535b86e2-4f01-4f60-a2d0-a5e4f5a7d312" },
          message: { S: "testing one two three" },
          type: { S: "message-only" },
          timestamp: { N: "1630517452" },
        },
      },
    },
  ],
});
