## `email-lambda`

As a fallback for users without desktop notifications turned-on etc. we'd like users who are 'mentioned' (both individually or group) to hear about them via a communication channels they're very familiar with and unlikely to ignore - email.

This lambda is invoked directly from a DB trigger and does the following...

1. queries the DB for additional information relating to the item it has been invoked with
1. collates into per-user data structure (multiple for group mentions)
1. looks-up the working titles and headlines from workflow (by invoking [`workflow-bridge-lambda`](../workflow-bridge-lambda))
1. loops through the users, sending them an email (using [AWS Simple Email Service (SES)](https://aws.amazon.com/ses/)) from the relevant pinboard domain - `mentions@pinboard.code.dev-gutools.co.uk` or `mentions@pinboard.gutools.co.uk`
   - These domains are registered as 'SES verified identities' and DNS validated automatically via CDK code 🎉 .
   - The email is rendered using `preact` (like the client) but using `style` attribute rather than emotion, for best compatibility with email clients.

Note that CODE emails are flagged as `External` - because `code.dev-gutools.co.uk` is not an alias in gSuite, but `gutools.co.uk` is.
