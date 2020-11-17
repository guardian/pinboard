# editorial-tools-pinboard
📌 PinBoard - the omnipresent 'content association' and chat tool.

To avoid the burden of maintaining lots of dependencies across all the different tools, PinBoard takes a different approach, where we add a `<script` tag to the various tools, which hits the `bootstrapping-lambda`...

## `bootstrapping-lambda`
This exists to...
- verify the pan-domain cookie
- lookup the AppSync config/secrets needed for the client
- return some JavaScript which then injects a further script tag in the page (which will load the main client-side PinBoard code), which upon loading is passed the AppSync config/secrets - so it can make the connection to AppSync.

## Running locally

### First-time set-up
Run `./setup.sh`, which...
- configures dev-nginx (according to `dev-nginx.yaml`)
- ensures all dependencies are installed

### Each time
- Ensure you have the latest AWS credentials (profile: `composer`)
- Run `./start.sh`, which should just ...
  - `nvm use`
  - run `yarn watch` in the `bootstrapping-lambda`
- to check its up, hit https://pinboard.local.dev-gutools.co.uk/pinboard.loader.js

NOTE: locally it uses the CODE AppSync API instance (since AppSync is a paid feature of localstack)