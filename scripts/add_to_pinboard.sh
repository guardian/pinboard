#!/bin/bash

set -eo pipefail

users="$1"
pinboardIds="$2"
stage="$3"

if [[ -z "$users" ]] || [[ -z "$pinboardIds" ]]; then
  echo "Usage: $0 <users> <pinboardIds> [stage]"
  echo "  users: comma-separated list of Guardian usernames (as appears in email addresses) to add to pinboards."
  echo "  pinboardIds: comma-separated list of pinboard IDs to add users to."
  echo "  stage: optionally choose another stage to edit. Defaults to PROD."
  echo ""
  echo "Example, to add firstname.lastname@guardian.co.uk and otherfirst.otherlast.freelancer@guardian.co.uk to pinboards 123 and 456:"
  echo "  $0 firstname.lastname,otherfirst.otherlast.freelancer 123,456"

  exit 1
fi

if [[ -z "$stage" ]]; then
  stage="PROD"
fi

users="$(echo $users | tr ',' ' ')"
delim=""
formattedPinboardIds=""
for word in $(echo $pinboardIds | tr ',' ' '); do
  formattedPinboardIds="$formattedPinboardIds$delim"'"'"$word"'"'
  delim=","
done

table="$(aws --region eu-west-1 --profile workflow cloudformation describe-stack-resources --stack-name pinboard-$stage | jq -r '.StackResources[] | select(.LogicalResourceId | startswith("pinboardusertable")) | .PhysicalResourceId')"

for user in $users; do
  email="$user@guardian.co.uk"
  echo adding $email to $formattedPinboardIds
  aws --region eu-west-1 --profile workflow \
    dynamodb update-item \
    --table-name $table \
    --key '{"email":{"S":"'$email'"}}' \
    --update-expression "Add manuallyOpenedPinboardIds :p" \
    --condition-expression 'email = :email' \
    --expression-attribute-values '{":p": {"SS":['"$formattedPinboardIds"']},":email":{"S":"'$email'"}}'
done
