# editorial-tools-pinboard

📌 PinBoard - the omnipresent 'content association' and chat tool.

To avoid the burden of maintaining lots of dependencies across all the different tools, PinBoard takes a different approach, where we add a `<script` tag to the various tools, which hits the `bootstrapping-lambda`...

## `bootstrapping-lambda`

This exists to...

- verify the pan-domain cookie
- lookup the AppSync config/secrets needed for the client
- return some JavaScript which then injects a further script tag in the page (which will load the main client-side PinBoard code), which upon loading is passed the AppSync config/secrets - so it can make the connection to AppSync.

## Updating the GraphQL schema

After making any changes to `shared/graphql/schema.graphql`, run `yarn graphql-refresh` in the root of the project. This will regenerate `shared/graphql/graphql.ts`, which contains the TypeScript type and resolver definitions to match the GraphQL schema. We use (GraphQL Code Generator)[https://graphql-code-generator.com/] to generate these definitions and this is configured in `graphql-refresh.yml`.

This generation step is run for you as part of the `setup.sh`, `start.sh` and `ci.sh` scripts.

Note, `shared/graphql/schema.graphql` is also used in CDK to form part of the Cloudformation.

## Running locally

### First-time set-up

Run `./scripts/setup.sh`, which...

- configures dev-nginx (according to `dev-nginx.yaml`)
- ensures all dependencies are installed

### Each time

- Ensure you have the latest AWS credentials (profile: `workflow`)
- Run `./scripts/start.sh`
- to check it's up, hit https://pinboard.local.dev-gutools.co.uk (to see the PinBoard widget etc. on a blank page - having gone through the auth and permission checks - if you don't see anything take a look at the console in the browser)

NOTE: locally it uses the CODE AppSync API instance (since AppSync is a paid feature of localstack)
