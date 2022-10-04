## `bootstrapping-lambda`

This lambda is a mini `express` app (using [`aws-serverless-express`](https://www.npmjs.com/package/aws-serverless-express)) with an API Gateway in front, with domain mapping...

- `pinboard.gutools.co.uk` for `PROD`
- `pinboard.code.dev-gutools.co.uk` for `CODE`
- `pinboard.local.dev-gutools.co.uk` for local development (achieved with [`dev-nginx`](../dev-nginx.yaml))

It has a few endpoints...

### `/pinboard.loader.js`

This is explicitly not cached and exists to...

- verify the pan-domain cookie and double-check user has `pinboard` permission
- lookup the AppSync connection details
- generate a authentication token, which AppSync will verify with [`auth-lambda`](../auth-lambda)
- return some JavaScript which then injects a further script tag in the page (which will load the [main client-side PinBoard code](../client) with the latest hash in its name, this is bundled in the lambda's ZIP), which upon loading is passed the AppSync config/secrets - so it can make the connection to AppSync.

### `/pinboard.main.HASH.js`

This endpoint ensures there is long-lived caching headers (since the content of this file never change given the hash in the name) and then continues on to serve the main client-side PinBoard code (via `next()` since there's also a `server.use(express.static(clientDirectory));` handler).

### `/_prout`

This endpoint has no auth and facilitates [PRout](https://github.com/guardian/prout) by serving the `GIT_COMMIT_HASH` constant in the `GIT_COMMIT_HASH.ts` file (which is overritten in CI with the current commit hash).
