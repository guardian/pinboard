#!/bin/bash
set -e

# TODO: should this really be in the start script?
# fnm install

yarn graphql-refresh

yarn watch
