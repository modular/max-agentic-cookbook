# //////////////////////////////////////////////////////////////////////
# BASE ON UNIVERSAL MAX CONTAINER
# Use MAX_VARIANT build arg to select base image:
#   - omitted/default → max-full:nightly
#   - MAX_VARIANT=amd → max-amd-full:nightly
#   - MAX_VARIANT=nvidia → max-nvidia-full:nightly

ARG MAX_GPU=universal
ARG MAX_TAG=latest

FROM modular/max-full:${MAX_TAG} AS base-universal
FROM modular/max-amd:${MAX_TAG} AS base-amd
FROM modular/max-nvidia-full:${MAX_TAG} AS base-nvidia

FROM base-${MAX_GPU} AS final

WORKDIR /app

# //////////////////////////////////////////////////////////////////////
# INSTALL NODE

RUN wget -qO- https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# //////////////////////////////////////////////////////////////////////
# INSTALL PNPM AND DEPENDENCIES

RUN npm install -g pm2 wait-on@7.2.0 pnpm@10.18.1

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/cookbook/ ./apps/cookbook/

# Install dependencies
RUN pnpm install --frozen-lockfile

# //////////////////////////////////////////////////////////////////////
# BUILD WEB APP

WORKDIR /app/apps/cookbook

RUN pnpm build

ENTRYPOINT []

WORKDIR /app

CMD ["pm2-runtime", "start", "apps/cookbook/ecosystem.config.js"]
