#!/bin/bash
mkdir -p /root/.agentcoin-fun

# Only create symlink if it doesn't already exist or if it's broken
if [ ! -L "/root/.agentcoin-fun/code" ] || [ ! -e "/root/.agentcoin-fun/code" ]; then
    ln -s /root/runtime /root/.agentcoin-fun/code
fi

# Execute the command passed to docker run (or CMD)
exec "$@"