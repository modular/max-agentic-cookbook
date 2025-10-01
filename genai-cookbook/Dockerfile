# FROM modular/max-amd-base
# or
FROM modular/max-nvidia-base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pm2 wait-on@7.2.0

COPY package*.json ./

RUN npm install

COPY . /app

RUN npm run build

ENTRYPOINT []

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
