# //////////////////////////////////////////////////////////////////////
# MAX RECIPES DEMO SERVER DOCKERFILE
# Runs MAX LLM serving + FastAPI backend + React SPA frontend
# Use MAX_GPU build arg to select base image:
#   - omitted/default → max-full:latest
#   - MAX_GPU=amd → max-amd:latest
#   - MAX_GPU=nvidia → max-nvidia-full:latest

ARG MAX_GPU=universal
ARG MAX_TAG=latest

FROM modular/max-full:${MAX_TAG} AS base-universal
FROM modular/max-amd:${MAX_TAG} AS base-amd
FROM modular/max-nvidia-full:${MAX_TAG} AS base-nvidia

FROM base-${MAX_GPU} AS final

WORKDIR /app

# //////////////////////////////////////////////////////////////////////
# INSTALL NODE.JS

RUN wget -qO- https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# //////////////////////////////////////////////////////////////////////
# INSTALL PM2, WAIT-ON, AND SERVE (for static frontend)

RUN npm install -g pm2 wait-on@7.2.0 serve

# //////////////////////////////////////////////////////////////////////
# INSTALL UV FOR PYTHON DEPENDENCY MANAGEMENT

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# //////////////////////////////////////////////////////////////////////
# SETUP BACKEND

COPY backend/ ./backend/

WORKDIR /app/backend
RUN uv sync --frozen

# //////////////////////////////////////////////////////////////////////
# BUILD FRONTEND

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# //////////////////////////////////////////////////////////////////////
# COPY ECOSYSTEM CONFIG

WORKDIR /app
COPY ecosystem.config.js ./

# //////////////////////////////////////////////////////////////////////
# EXPOSE PORTS
# 8000 - MAX LLM serving
# 8001 - FastAPI backend
# 3000 - Frontend (static files)

EXPOSE 8000 8001 3000

# //////////////////////////////////////////////////////////////////////
# START ALL SERVICES WITH PM2

ENTRYPOINT []
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
