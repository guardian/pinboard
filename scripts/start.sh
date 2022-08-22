#!/bin/bash
set -e

fnm install

yarn graphql-refresh

yarn watch
