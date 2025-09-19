# Modular GenAI Cookbook

A collection of fullstack recipes demonstrating how to build modern generative AI applications using Modular MAX, Next.js, and the Vercel AI SDK. Unlike other recipes in this repository that are Python-based, the GenAI Cookbook provides TypeScript-based, production-ready patterns for building interactive AI experiences.

## Overview

The GenAI Cookbook showcases best practices for integrating Modular MAX's high-performance inference capabilities with modern web frameworks. Each recipe demonstrates end-to-end workflows with both frontend and backend implementations, complete with detailed inline documentation explaining the architecture and design decisions.

### Featured Recipes

#### 1. **Multi-turn Chat**
Build a streaming chat interface that maintains conversation context across multiple exchanges. This recipe demonstrates:
- Real-time token streaming using Vercel AI SDK
- Seamless switching between Modular MAX and OpenAI-compatible endpoints
- Auto-scrolling message display with Mantine UI components
- Persistent conversation history management
- Route-aware API handling for modular deployment

#### 2. **Image Captioning**
Create an intelligent image captioning system that generates natural language descriptions for uploaded images. Features include:
- Drag-and-drop image upload with Mantine Dropzone
- Base64 image encoding for API transport
- Customizable prompting for caption generation
- Gallery view with loading states and progress indicators
- Support for multiple concurrent caption requests

## Requirements

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Modular MAX** server running locally or remotely
- Optional: OpenAI API key for comparing with OpenAI models

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/modular/max-recipes.git
   cd max-recipes/genai-cookbook
   ```

2. **Install dependencies**
   ```bash
   npm install
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

   For multiple endpoints or comparison with OpenAI and compatible servers:
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
   npm run dev
   ```

5. **Open the cookbook**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

The GenAI Cookbook follows a modern fullstack architecture optimized for AI applications:

```
genai-cookbook/
├── app/                      # Next.js 14 App Router
│   ├── recipes/             # Individual recipe implementations
│   │   ├── multiturn-chat/
│   │   │   ├── page.tsx     # Frontend UI component
│   │   │   ├── api/
│   │   │   │   └── route.ts # Backend API handler
│   │   │   └── recipe.json  # Recipe metadata
│   │   └── image-captioning/
│   │       ├── page.tsx
│   │       ├── api/
│   │       │   └── route.ts
│   │       └── recipe.json
│   └── layout.tsx           # Root layout with providers
├── components/              # Reusable UI components
│   ├── cookbook-shell/      # Navigation and layout
│   └── recipe-partials/     # Recipe-specific components
├── hooks/                   # Custom React hooks
│   └── useCookbook.ts      # Endpoint/model selection
├── lib/                     # Utility functions
│   ├── loadRecipes.ts      # Dynamic recipe loading
│   └── constants.ts        # Shared constants
└── store/                   # State management
    └── EndpointStore.ts    # Endpoint configuration
```

### Key Technologies

- **[Modular MAX](https://docs.modular.com/max/)**: High-performance AI inference engine
- **[Next.js 14](https://nextjs.org/)**: React framework with App Router for modern web applications
- **[Vercel AI SDK](https://sdk.vercel.ai/)**: Unified interface for AI model providers
- **[Mantine UI](https://mantine.dev/)**: Professional React component library
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development experience

## Development

### Adding a New Recipe

1. Create a new directory under `app/recipes/your-recipe-name/`
2. Add the following files:
   - `page.tsx`: Frontend component
   - `api/route.ts`: Backend API handler
   - `recipe.json`: Recipe metadata
3. The recipe will be automatically discovered and added to the navigation

### Code Structure Guidelines

Each recipe follows consistent patterns for maintainability:

- **Frontend (`page.tsx`)**: Uses React hooks for state management, Mantine for UI, and detailed inline comments explaining the workflow
- **Backend (`api/route.ts`)**: Implements OpenAI-compatible protocol using Vercel AI SDK for model abstraction
- **Type Safety**: Full TypeScript coverage with explicit interfaces for data structures

## Running with Modular MAX

To use the cookbook with Modular MAX:

1. **Start MAX server** (in a separate terminal):
   ```bash
   max serve --model meta-llama/Llama-3.1-8B-Instruct
   ```

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

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build production-optimized bundle
- `npm run start` - Run production server
- `npm run lint` - Run ESLint checks
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

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

- [Modular MAX Documentation](https://docs.modular.com/max/)
- [MAX Serving Guide](https://docs.modular.com/max/serve/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Mantine Components](https://mantine.dev/core/getting-started/)

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
