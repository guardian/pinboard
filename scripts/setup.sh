#!/bin/bash

export NVM_DIR=$HOME/.nvm
source $NVM_DIR/nvm.sh
nvm install

dev-nginx setup-app dev-nginx.yaml

yarn

yarn graphql-refresh
