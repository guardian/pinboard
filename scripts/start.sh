#!/bin/bash

export NVM_DIR=$HOME/.nvm
source $NVM_DIR/nvm.sh
nvm install

yarn graphql-refresh

yarn --cwd 'client' watch & yarn --cwd 'bootstrapping-lambda' watch
