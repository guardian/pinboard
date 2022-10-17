import { handler, UserWithWebPushSubscription } from "./src";
import { createDatabaseTunnel } from "../shared/database/local/databaseTunnel";
import { getDatabaseConnection } from "../shared/database/databaseConnection";
import { getYourEmail } from "../shared/local/yourEmail";

(async () => {
  const yourEmail = await getYourEmail();

  await createDatabaseTunnel();

  const sql = await getDatabaseConnection();

  const yourUser = await sql`
      SELECT *
      FROM "User"
      WHERE "email" = ${yourEmail}
        AND "webPushSubscription" IS NOT NULL
  `.then((rows) => rows[0]);

  if (!yourUser) {
    throw Error(
      `You (${yourEmail}) don't have a web push subscription in the DB. Please try again after subscribing in the browser via pinboard UI.`
    );
  }

  await handler({
    item: {
      pinboardId: "63923",
      payload: null,
      mentions: ["tom.richards@guardian.co.uk"],
      groupMentions: [],
      userEmail: "tom.richards@guardian.co.uk",
      id: "535b86e2-4f01-4f60-a2d0-a5e4f5a7d312",
      message: "testing one two three",
      type: "message-only",
      timestamp: new Date(1630517452000).toISOString(),
    },
    users: [yourUser as UserWithWebPushSubscription],
  });
})().catch(console.error);
