#!/bin/bash
set -e

# https://classic.yarnpkg.com/en/docs/cli/policies/#toc-policies-set-version
# This could be removed if all TC agents guaranteed global yarn installed
shopt -s expand_aliases
PROJECT_ROOT=$(pwd)
alias yarn='node ${PROJECT_ROOT}/.yarn/releases/yarn-*.*js'

# install ALL dependencies
yarn install

# generate TS definitions for GraphQL schema
yarn graphql-refresh

# perform a prettier check
yarn prettier-check

# perform a linting check
yarn lint

# generate cloudformation.yaml
yarn --cwd 'cdk' synth

# write the current GIT hash to GIT_COMMIT_HASH.ts (so it's available at build time - so it gets baked into the artifact)
GIT_COMMIT_HASH=$(git rev-parse HEAD)
echo 'export const GIT_COMMIT_HASH = "'$GIT_COMMIT_HASH'";' > GIT_COMMIT_HASH.ts

# build bootstrapping-lambda into a single file
yarn --cwd 'bootstrapping-lambda' build

# bundle the client code into a single file (which ends up in the dist dir of the bootstrapping-lambda)
yarn --cwd 'client' build

# build workflow-bridge-lambda into a single file
yarn --cwd 'workflow-bridge-lambda' build

# build users-refresher-lambda into a single file
yarn --cwd 'users-refresher-lambda' build

# build notifications-lambda into a single file
yarn --cwd 'notifications-lambda' build

# build auth-lambda into a single file
yarn --cwd 'auth-lambda' build

# build push-notifications service-worker
yarn --cwd 'client' build-service-worker

# create a top level dist directory and copy in the built stuff
mkdir -p dist/client
cp -v bootstrapping-lambda/dist/index.js dist/
cp -v client/dist/pinboard.main* dist/client
cp -rv client/dist/push-notifications dist/client
rm dist/client/push-notifications/report.html

# upload riff-raff artifacts
yarn node-riffraff-artifact
