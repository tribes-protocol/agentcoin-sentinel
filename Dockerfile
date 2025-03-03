FROM ubuntu:latest


# Update and install essential packages including Python and node-gyp dependencies
RUN apt-get update && apt-get install -y \
  build-essential \
  git \
  iputils-ping \
  vim \
  curl \
  wget \
  net-tools \
  dnsutils \
  iproute2 \
  traceroute \
  tcpdump \
  telnet \
  unzip \
  tree \
  python3 \
  python-is-python3 \
  make \
  g++ \
  cpulimit \
  sqlite3 && \ 
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Add this line to explicitly install sqlite-vec for ARM64
# RUN pnpm add sqlite-vec-linux-arm64

# Install Node.js 22.13.0
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && \
  nvm install 22.13.0 && \
  nvm use 22.13.0 && \
  nvm alias default 22.13.0

# Add node and npm to path so the commands are available
ENV NODE_PATH=$NVM_DIR/v22.13.0/lib/node_modules
ENV PATH=$NVM_DIR/versions/node/v22.13.0/bin:$PATH

# Install bun globally
RUN npm i -g bun node-gyp rimraf tsup tsx dotenv-cli

# need to cache bust the build
ARG CACHE_BUST=v2

# clone the repos
# sentinel
RUN git clone https://github.com/tribes-protocol/agentcoin-sentinel.git /root/sentinel
WORKDIR /root/sentinel
RUN bun install
RUN bun run build

# runtime
RUN git clone https://github.com/tribes-protocol/agentcoin-runtime.git /root/runtime
WORKDIR /root/runtime
RUN bun install
RUN bun run build

# Add an entrypoint script
USER root
ENV HOME=/root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]