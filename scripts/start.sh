#!/bin/bash
set -e

mise install

yarn graphql-refresh

yarn watch
