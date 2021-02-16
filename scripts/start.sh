#!/bin/bash
set -e

export NVM_DIR=$HOME/.nvm
source $NVM_DIR/nvm.sh
nvm install

yarn graphql-refresh

yarn --cwd 'client' devBuild # so on fresh start, the bundle is ready to be served by 'bootstrapping-lambda' below

yarn --cwd 'client' watch & yarn --cwd 'bootstrapping-lambda' watch
