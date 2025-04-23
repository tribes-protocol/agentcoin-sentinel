#!/bin/bash
mkdir -p /root/.ayaos

# Only create symlink if it doesn't already exist or if it's broken
if [ ! -L "/root/.ayaos/code" ] || [ ! -e "/root/.ayaos/code" ]; then
    ln -s /root/ayaos /root/.ayaos/code
fi

# Source the database environment
if [ -f "/root/.ayaos/db.env" ]; then
    set -a
    source /root/.ayaos/db.env
    export POSTGRES_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@agent-postgres:5432/${POSTGRES_DB}"
    set +a
fi

# Source the environment file if it exists
if [ -f "/root/.ayaos/.env" ]; then
    set -a
    source /root/.ayaos/.env
    set +a
fi

# Execute the command passed to docker run (or CMD)
exec "$@"