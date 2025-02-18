#!/bin/bash
mkdir -p /root/.agentcoin-fun

# Only create symlink if it doesn't already exist or if it's broken
if [ ! -L "/root/.agentcoin-fun/code" ] || [ ! -e "/root/.agentcoin-fun/code" ]; then
    ln -s /root/runtime /root/.agentcoin-fun/code
fi

# Source the environment file if it exists
if [ -f "/root/.agentcoin-fun/env.production" ]; then
    set -a
    source /root/.agentcoin-fun/env.production
    set +a
fi

# Execute the command passed to docker run (or CMD)
exec "$@"