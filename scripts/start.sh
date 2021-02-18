#!/bin/bash
set -e

export NVM_DIR=$HOME/.nvm
source $NVM_DIR/nvm.sh
nvm install

yarn graphql-refresh

yarn watch
