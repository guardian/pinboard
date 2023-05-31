## `email-lambda`

As a fallback for users without desktop notifications turned-on etc. we'd like users who miss key messages (individual mentions currently, but group mentions and potentially other ) to hear about them via a communication channels they're very familiar with and unlikely to ignore - email.

This lambda runs every 5 minutes and does the following...

1. queries the DB for
   - items with individual mentions which have remained unread for more than an hour (by those mentioned) and haven't had `isEmailEvaluated` set to true.
   - items where `Central Production` is group mentioned and haven't had `isEmailEvaluated` set to true.
1. collates all items into per-user data structure, and then per-pinboard within that
1. looks-up the working titles and headlines from workflow (by invoking [`workflow-bridge-lambda`](../workflow-bridge-lambda))
1. loops through the users, sending them an email (using [AWS Simple Email Service (SES)](https://aws.amazon.com/ses/)) from the relevant pinboard domain - `mentions@pinboard.code.dev-gutools.co.uk` or `mentions@pinboard.gutools.co.uk`
   - These domains are registered as 'SES verified identities' and DNS validated automatically via CDK code 🎉 .
   - The email is rendered using `preact` (like the client) but using `style` attribute rather than emotion, for best compatibility with email clients.
1. sets `isEmailEvaluated` to true for the items it has emailed about

Note that CODE emails are flagged as `External` - because `code.dev-gutools.co.uk` is not an alias in gSuite, but `gutools.co.uk` is.
