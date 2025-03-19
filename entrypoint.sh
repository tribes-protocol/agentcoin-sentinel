#!/bin/bash
mkdir -p /root/.agentcoin-fun

# Only create symlink if it doesn't already exist or if it's broken
if [ ! -L "/root/.agentcoin-fun/code" ] || [ ! -e "/root/.agentcoin-fun/code" ]; then
    ln -s /root/agent /root/.agentcoin-fun/code
fi

# # Setup database environment if it doesn't exist
# if [ ! -f "/root/.agentcoin-fun/db.env" ]; then
#     echo "Generating new db.env file..."
#     echo "POSTGRES_USER=agentcoin" > /root/.agentcoin-fun/db.env
#     echo "POSTGRES_DB=agentcoin" >> /root/.agentcoin-fun/db.env
#     echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> /root/.agentcoin-fun/db.env
#     chmod 600 /root/.agentcoin-fun/db.env
# fi

# Source the database environment
if [ -f "/root/.agentcoin-fun/db.env" ]; then
    set -a
    source /root/.agentcoin-fun/db.env
    export POSTGRES_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@agent-postgres:5432/${POSTGRES_DB}"
    set +a
fi

# Source the environment file if it exists
if [ -f "/root/.agentcoin-fun/.env" ]; then
    set -a
    source /root/.agentcoin-fun/.env
    set +a
fi

# Execute the command passed to docker run (or CMD)
exec "$@"