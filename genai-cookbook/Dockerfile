FROM modular/max-amd-base
# or
# FROM modular/max-nvidia-base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of application (including .env.local if it exists)
COPY . /app

# Build the NextJS app
RUN npm run build

# Override base image ENTRYPOINT and start MAX + NextJS services with PM2
ENTRYPOINT []
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
