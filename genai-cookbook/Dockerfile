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
# INSTALL NPM PACKAGES

RUN npm install -g pm2 wait-on@7.2.0

COPY package*.json ./

RUN npm install

# //////////////////////////////////////////////////////////////////////
# BUILD WEB APP

COPY . /app

RUN npm run build

ENTRYPOINT []

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
