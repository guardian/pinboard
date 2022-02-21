# editorial-tools-pinboard

📌 PinBoard - the omnipresent 'content association' and chat tool.

This project is written pretty much exclusively in TypeScript (both frontend & backend) and is entirely serverless (server side is a set of lambdas plus [AWS AppSync](https://aws.amazon.com/appsync/)). We use [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) to break up the project into different sub-projects, and also have a shared top level `tsconfig.json` (which is then [extended](https://www.typescriptlang.org/tsconfig#extends) in the sub-project, e.g. to configure react in the `client` sub-project).

To avoid the burden of maintaining lots of dependencies across all the different tools, PinBoard takes a different approach, where we add a `<script` tag to the various tools ([e.g. in composer](https://github.com/guardian/flexible-content/blame/f9d37a49b0690a67952d2ccccf5255ab3dd7a3a6/flexible-content-composer-backend/src/main/webapp/WEB-INF/scalate-admin/composer.ssp#L106-L108)), which hits the `bootstrapping-lambda` on the `/pinboard.loader.js` endpoint (which is explicitly NOT cached)...

## `bootstrapping-lambda`

This exists to...

- verify the pan-domain cookie
- lookup the AppSync config/secrets needed for the client
- return some JavaScript which then injects a further script tag in the page (which will load the [main client-side PinBoard code](#client)), which upon loading is passed the AppSync config/secrets - so it can make the connection to AppSync.

## `client`

This module contains the all the real client side code, and is served by the [`bootstrapping-lambda`](#bootstrapping-lambda) (aggressively cached). We use [webpack](https://webpack.js.org/) for bundling the client.

#### `entry.tsx`

This exposes the `mount` function which is called in the javascript served by the `/pinboard.loader.js` endpoint mentioned above, receiving the AppSync connection information along with the signed in user's email. With this information it builds an `ApolloClient` and renders the top-level component `PinBoardApp` as defined by `app.tsx`...

### `app.tsx`

This is passed the `ApolloClient` as prop (by `entry.tsx` above) and makes it available to the rest of the application via an `ApolloProvider` (which means a client needn't be explicitly provided elsewhere in the application when using the hooks: `useQuery`, `useMutation` and `useSubscription`). This component is also responsible for searching through DOM of the host page looking for `<asset-handle>` tags (which the grid for example exposes on each crop, with useful info in the ['data attributes'](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)) it also sets up a [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to repeatedly do this as the DOM of the host application changes (this way, pinboard need not care about how the host application is rendered; Angular1 in the case of composer & grid). It uses this list to render a set of [`ButtonPortal` (see below)](#addToPinboardButtontsx). Its also responsible for adding the [`Floaty` component (see below)](#floatytsx).

#### `addToPinboardButton.tsx`

This receives the DOM node found by `app.tsx` (see above) and using [React Portals](https://reactjs.org/docs/portals.html) takes over the rendering of that DOM node, in order to present an 'Add To Pinboard' button. Clicking this button takes the ['data attributes'](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) to build a `payload` for the Item (shared with the `SendMessageArea` via a top-level bit of state `payloadToBeSent`).

#### `floaty.tsx`

This component is the main UI of pinboard and brings togeth the majority of the other visual components, i.e. it's the floating blue pin icon in the yellow circle, which expands to reveal the main rectangular area of pinboard. It holds state on if there is a pinboard selected (including if preselected, detected by the [`app.tsx`](#apptsx) based on the presence of `<pinboard-preselect>` tag in the host applications DOM - notably in composer when viewing an article), and either renders the [`SelectPinboard` (see below)](#selectPinboardtsx) or not, accordingly. It also maintains a list of 'active' pinboards and renders each using the [`Pinboard` component (see below)](#pinboardtsx), these stay 'mounted' and hide themselves (with `display: none` if it's not the 'selected pinboard') that way we can keep the 'subscription' open to receive new items. It also has a 'subscription' to hear about 'mentions' on ANY pinboard.

#### `selectPinboard.tsx`

This components presents a rudimentary list of available pinboards (with basic client-side free text search), retrieved via a `useQuery` that ultimately gets workflow stubs and presents their working titles as clickable buttons.

#### `pinboard.tsx`

This has both an initial 'query' to retrieve the existing items and a 'subscription' to keep this live, as well as some state for the sends the user makes, all of which are aggregated/de-duplicated and passed to `ScrollableItems` (which repeats the `ItemDisplay` component for each item). It also brings in the `SendMessageArea` component, which is responsible for the 'mutation' to create items.

## `users-refresher-lambda`

This lambda runs on a schedule (currently every 6 hours) and looks up which users have Pinboard permission and looks up their details using the Google People API (with a separate call to get their `avatarUrl` where available) it stores all these into the User table (with a TTL field, which the table is configured to discard expired rows automatically, to handle people who leave the organisation etc.). This User table is fetched in its entirety when the pinboard client loads, to serve various purposes, such as populating the list of people available to 'mention', as well as acting as a lookup for resolving people's names and avatars in the display of each item (meaning we only need to store `userEmail` against each row in the Item table, rather than repeating all that metadata for every single message).

## `workflow-bridge-lambda`

This exists to interact with the backend of [`workflow`](https://github.com/guardian/workflow) (which is not public facing, but instead this lambda is given access to the VPC/subnets which workflow backend uses) for retrieving the list of available pinboards (for the moment, a pinboard is just a workflow stub) and to lookup specific workflow items based on composer ID (used in the 'preselected' pinboard feature in composer). This lambda is configured as a 'data source' in AppSync, which means if we ever store 'pinboards' elsewhere, such as our own table, the client won't have to change one bit! In general this approach also avoids us having to either connect AppSync directly to workflow tables (bad practice, as they could legitimately have their shape change, and thus break Pinboard) or connect AppSync to [`workflow-frontend`](https://github.com/guardian/workflow-frontend) via HTTP, which would require panda cookies (messy to forward from client, or would need to set-up panda-hmac). Lastly this also means the lambda can transform the responses however we need them (all in nice TypeScript, not nasty 'Velocity' which is the language of the AppSync resolvers).

## `cdk`

The cdk module contains all of our infrastructure definitions. Unfortunately [`@guardian/cdk`](https://github.com/guardian/cdk) wasn't mature at the time the bulk of this CDK code was written, so it just uses standard CDK constructs in TypeScript (which is still infinitely better than writing CloudFormation). It includes a `build` yarn script to make it easy to generate a `cloudformation.yaml` (which is done at CI time), so it can be cloudformed with [Riff-Raff](https://github.com/guardian/riff-raff).

_Right now everything is one main file `stack.ts`, which is due a refactor to break it up, find abstractions and use [`@guardian/cdk`](https://github.com/guardian/cdk) where possible._

## Updating the GraphQL schema

After making any changes to `shared/graphql/schema.graphql`, run `yarn graphql-refresh` in the root of the project. This will regenerate `shared/graphql/graphql.ts`, which contains the TypeScript type and resolver definitions to match the GraphQL schema. We use [GraphQL Code Generator](https://graphql-code-generator.com/) to generate these definitions and this is configured in `graphql-refresh.yml`.

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
- to check it's up, hit https://pinboard.local.dev-gutools.co.uk (to see the PinBoard floaty etc. on a blank page - having gone through the auth and permission checks - if you don't see anything take a look at the console in the browser)

NOTE: locally it uses the CODE AppSync API instance (since AppSync is a paid feature of localstack)
