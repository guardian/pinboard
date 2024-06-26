#!/bin/bash -ev
LAST_ACTIVE_SSHD=$(date +%s)

while :
do
    echo "SSH tunnel last active at $LAST_ACTIVE_SSHD"
    if [ "$(sudo lsof -i -n | egrep '\<sshd\>' | grep ubuntu)" = "1" ]; then
        echo "SSH tunnel detected, bumping LAST_ACTIVE_SSHD"
        LAST_ACTIVE_SSHD=$(date +%s)
    fi
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_ACTIVE_SSHD))
    if [ "$DIFF" -gt 9000 ]; then #i.e. 150 mins since last active ssh tunnel
        echo "No active SSH tunnel in the last 5mins - so scaling down"
        aws autoscaling set-desired-capacity\
         --auto-scaling-group-name "$1"\
         --desired-capacity 0\
         --no-honor-cooldown\
         --region "$2"
    fi
    sleep 60
done & # this ampersand runs the whole loop in the background...
# ...so cloud-init will 'finish' so other things on the box can actually start, notably ssm-agent for SSHing
