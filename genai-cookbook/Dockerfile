# //////////////////////////////////////////////////////////////////////
# BASE ON UNIVERSAL MAX CONTAINER
# FROM modular/max-full:25.7.0.dev2025100305
# FROM modular/max-nvidia-full:nightly
FROM modular/max-amd:nightly

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
