#!/bin/bash
set -e

corepack enable

fnm install || true
nvm install || true

dev-nginx setup-app dev-nginx.yaml

yarn

yarn graphql-refresh
