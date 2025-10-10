# Modular Agentic Cookbook

The Agentic Cookbook is collection of recipes demonstrating how to build modern fullstack web apps using Modular MAX, Next.js, and the Vercel AI SDK. Unlike other recipes in the MAX Recipes repo—which are Python-based—the Agentic Cookbook is written exclusively in TypeScript, providing production-ready patterns for building interactive AI experiences. Each recipe demonstrates an end-to-end workflow with both frontend and backend implementations, including detailed code comments.

<img src="https://github.com/user-attachments/assets/e2302038-a950-41a8-acec-47c0d9c09ed6" />

## Requirements

- **Node.js** 18.x or higher
- **pnpm** package manager
- **MAX** server running locally or remotely—see the [MAX quickstart](https://docs.modular.com/max/get-started/)

## Get Started

1. **Clone the repository**

    ```bash
    git clone https://github.com/modular/max-recipes.git
    cd max-recipes/genai-cookbook
    ```

2. **Install dependencies**

    ```bash
    pnpm install
    ```

3. **Configure environment variables**

    Copy the sample environment file and configure your endpoints:

    ```bash
    cp .sample.env .env.local
    ```

    Edit `.env.local` to add your Modular MAX endpoint configuration:

    ```env
    COOKBOOK_ENDPOINTS='[
      {
        "id": "max-local",
        "baseUrl": "http://127.0.0.1:8000/v1",
        "apiKey": "EMPTY"
      }
    ]'
    ```

    You may enter multiple endpoints for comparison with OpenAI and other compatible servers:

    ```env
    COOKBOOK_ENDPOINTS='[
      {
        "id": "max-local",
        "baseUrl": "http://127.0.0.1:8000/v1",
        "apiKey": "EMPTY"
      },
      {
        "id": "openai",
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "your-openai-api-key"
      }
    ]'
    ```

4. **Start the development server**

    ```bash
    pnpm dev
    ```

5. **Open the cookbook**

    Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Featured Recipes

### 1. **Multi-turn Chat**

Build a streaming chat interface that maintains conversation context across multiple exchanges. This recipe demonstrates:

- Real-time token streaming using the Vercel AI SDK
- Auto-scrolling message display using Mantine

### 2. **Image Captioning**

Create an intelligent image captioning system that generates natural language descriptions for uploaded images. Features include:

- Drag-and-drop image upload with Mantine Dropzone
- Base64 image encoding for API transport
- Customizable prompt for caption generation
- Gallery view with loading states and progress indicators

## Architecture

The Agentic Cookbook follows a modern fullstack architecture optimized for AI applications, organized as a pnpm workspace monorepo:

```
genai-cookbook/
├── apps/
│   └── cookbook/            # Next.js 14 App with App Router
│       ├── app/             # Next.js app directory
│       │   ├── api/         # API routes
│       │   │   ├── endpoints/   # Endpoint API handler
│       │   │   └── models/      # Models API handler
│       │   │
│       │   ├── cookbook/    # Cookbook pages
│       │   │   ├── [recipe]/    # Dynamic recipe routes
│       │   │   │   ├── page.tsx     # Recipe UI (lazy-loaded)
│       │   │   │   ├── code/        # Recipe code viewer
│       │   │   │   └── api/         # Recipe API handler
│       │   │   │
│       │   │   ├── page.tsx     # Cookbook home
│       │   │   └── layout.tsx   # Cookbook layout
│       │   │
│       │   ├── page.tsx     # Landing page
│       │   └── layout.tsx   # Root layout
│       │
│       ├── components/      # Reusable UI components
│       ├── context/         # React context providers
│       ├── lib/             # Shared utilities
│       ├── styles/          # Global styles
│       └── Dockerfile       # Container configuration
│
└── packages/
    └── recipes/             # Shared recipe implementations
        └── src/
            ├── multiturn-chat/
            │   ├── ui.tsx       # Frontend UI component
            │   ├── api.ts       # Backend API logic
            │   └── recipe.json  # Recipe metadata
            │
            ├── image-captioning/
            │   ├── ui.tsx
            │   ├── api.ts
            │   └── recipe.json
            │
            └── lib/         # Recipe utilities and types
```

## Development

### Adding a New Recipe

1. Create a new directory under `packages/recipes/src/your-recipe-name/`
2. Add the following files:
    - `ui.tsx`: Frontend UI component (React)
    - `api.ts`: Backend API handler (receives Request and RecipeContext)
    - `recipe.json`: Recipe metadata

Recipes will hot-reload changes when running in development, but the server must be restarted to load new recipes.

### Code Structure Guidelines

Each recipe follows consistent patterns for maintainability:

- **Frontend (`ui.tsx`)**: Uses React hooks for state management, Mantine for UI, and detailed inline comments explaining the workflow
- **Backend (`api.ts`)**: Uses the Vercel AI SDK for communicating with MAX model serving
- **Type Safety**: Full TypeScript coverage with explicit interfaces for data structures

## Running with MAX

To use the cookbook with MAX:

1. **Start the model server** (in a separate terminal):

    ```bash
    max serve --model google/gemma-3-27b-it
    ```

    For more details, see the [MAX quickstart](https://docs.modular.com/max/get-started/).

2. **Configure the endpoint** in `.env.local`:

    ```env
    COOKBOOK_ENDPOINTS='[
      {
        "id": "max",
        "baseUrl": "http://127.0.0.1:8000/v1",
        "apiKey": "EMPTY"
      }
    ]'
    ```

3. **Select MAX** in the cookbook UI endpoint selector

## Running with Docker

The Agentic Cookbook can be run entirely within a Docker container, including the MAX model server and web application. The container uses the universal MAX image with the nightly build, supporting both NVIDIA and AMD GPUs.

### Building the Container

Build the universal container image:

```bash
docker build --ulimit nofile=65535:65535 -t max-cookbook:latest .
```

**Note:** The `--ulimit nofile=65535:65535` flag increases the file descriptor limit, which is needed for Next.js builds.

#### Build Arguments

You can customize the Docker build using these arguments to reduce container size:

- **MAX_GPU**: Selects the base image (default: `universal`)
    - `universal` → `modular/max-full` (larger, supports all GPU types)
    - `amd` → `modular/max-amd` (smaller, AMD-specific)
    - `nvidia` → `modular/max-nvidia-full` (smaller, NVIDIA-specific)

- **MAX_TAG**: Selects the image version (default: `latest`)
    - `latest` → Latest stable release
    - `nightly` → Nightly development builds
    - Specific versions (e.g., `25.7.0`)

**Examples:**

Build smaller AMD-specific container:

```bash
docker build --build-arg MAX_GPU=amd --ulimit nofile=65535:65535 -t max-cookbook:amd .
```

Build smaller NVIDIA-specific container with nightly builds:

```bash
docker build --build-arg MAX_GPU=nvidia --build-arg MAX_TAG=nightly --ulimit nofile=65535:65535 -t max-cookbook:nvidia-nightly .
```

### Running the Container

#### NVIDIA GPU

```bash
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HF_HUB_ENABLE_HF_TRANSFER=1" \
    --env "HF_TOKEN=your-huggingface-token" \
    --env "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 \
    -p 3000:3000 \
    max-cookbook:latest
```

#### AMD GPU

```bash
docker run \
    --group-add keep-groups \
    --rm \
    --device /dev/kfd \
    --device /dev/dri \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HF_HUB_ENABLE_HF_TRANSFER=1" \
    --env "HF_TOKEN=your-huggingface-token" \
    --env "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 \
    -p 3000:3000 \
    max-cookbook:latest
```

**Configuration:**

- **Port 8000**: MAX model serving endpoint
- **Port 3000**: Agentic Cookbook web application
- **HF_TOKEN**: Your HuggingFace token for downloading models
- **MAX_MODEL**: The model to serve (e.g., `google/gemma-3-27b-it`)
- **Volume mount**: Caches downloaded models in `~/.cache/huggingface`

Once running, navigate to [http://localhost:3000](http://localhost:3000) to access the cookbook.

## Available Scripts

- `pnpm dev` - Start development server with hot reloading (uses Turbopack)
- `pnpm build` - Build production-optimized bundle
- `pnpm start` - Run production server
- `pnpm lint` - Run ESLint checks
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Learn More

### Exploring the Recipes

The best way to learn is by exploring the live cookbook:

1. **Run the cookbook** and browse through the recipes
2. **Toggle "Show Code"** in the UI to see the implementation alongside the demo
3. **Read the inline comments** - each recipe contains extensive documentation explaining:
    - Architecture decisions
    - Data flow patterns
    - Integration points with Modular MAX
    - UI/UX considerations

### Documentation Resources

- [Modular](https://docs.modular.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Next.js](https://nextjs.org/docs)
- [Mantine](https://mantine.dev/core/getting-started/)

## Contributing

We welcome contributions! Whether you're adding new recipes, improving existing ones, or fixing bugs:

1. Fork the repository
2. Create a feature branch
3. Add your recipe following the established patterns
4. Ensure all TypeScript types are properly defined
5. Add comprehensive inline documentation
6. Submit a pull request

## Support

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/modular/max-recipes/issues)
- **Forum**: Visit the [Modular Forum](https://forum.modular.com/) for in-depth technical discussions

## License

This project is part of the MAX Recipes collection. See the repository root for license information.
