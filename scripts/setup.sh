#!/bin/bash
set -e

fnm install

dev-nginx setup-app dev-nginx.yaml

yarn

yarn graphql-refresh
