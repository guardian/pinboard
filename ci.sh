#!/bin/bash
shopt -s expand_aliases


# https://classic.yarnpkg.com/en/docs/cli/policies/#toc-policies-set-version
# This could be removed if all TC agents guaranteed global yarn installed
PROJECT_ROOT=$(pwd)
alias yarn='node ${PROJECT_ROOT}/.yarn/releases/yarn-*.cjs'

# install ALL dependencies
yarn install

# generate cloudformation.yaml
yarn --cwd 'cdk' synth

# write the current GIT hash to GIT_COMMIT_HASH.ts (so it's available at build time - so it gets baked into the artifact)
GIT_COMMIT_HASH=$(git rev-parse HEAD)
echo 'export const GIT_COMMIT_HASH = "'$GIT_COMMIT_HASH'";' > GIT_COMMIT_HASH.ts

# build bootstrapping-lambda into a single file
yarn --cwd 'bootstrapping-lambda' build

# bundle the client code into a single file (which ends up in the dist dir of the bootstrapping-lambda)
yarn --cwd 'client' build

# create a top level dist directory and copy in the built stuff
mkdir -p dist/client
cp bootstrapping-lambda/dist/index.js dist/
cp client/dist/pinboard.main* dist/client

# upload riff-raff artifacts
yarn node-riffraff-artifact
