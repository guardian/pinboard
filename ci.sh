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

# upload riff-raff artifacts
yarn node-riffraff-artifact
