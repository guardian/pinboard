#!/bin/bash
set -e

# TODO: shouldn't node be installed before corepack?
# then do npm install --global corepack@latest

corepack enable

# fnm install || true
# nvm install || true

dev-nginx setup-app dev-nginx.yaml

yarn

yarn graphql-refresh
