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

# Install PM2 and wait-on globally
RUN npm install -g pm2 wait-on@7.2.0

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of application (including .env.local if it exists)
COPY . /app

# Build the NextJS app
RUN npm run build

# Set multiline environment variable
ENV COOKBOOK_ENDPOINTS='[\
  {\
    "id": "max",\
    "baseUrl": "http://host.docker.internal:8000/v1",\
    "apiKey": "EMPTY",\
  }\
]'

# Override base image ENTRYPOINT and start MAX + NextJS services with PM2
ENTRYPOINT []
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
