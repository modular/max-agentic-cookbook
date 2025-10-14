import type { RecipeMetadata } from '../types'

export const recipeMetadata: Record<string, RecipeMetadata> = {
    'image-captioning': {
        slug: 'image-captioning',
        title: 'Image Captioning',
        description:
            "Generate captions for multiple images with progressive NDJSON streaming. Upload images, customize the prompt, and watch captions appear instantly as they're generated. Includes a custom useNDJSON hook for streaming, parallel processing for speed, and performance metrics (TTFT and duration) for each image. Works with Modular MAX or any OpenAI-compatible endpoint.",
    },
    'multiturn-chat': {
        slug: 'multiturn-chat',
        title: 'Multi-turn Chat',
        description:
            'Streaming chat interface with multi-turn conversation support. Messages stream token-by-token for fluid responses, with automatic scroll-follow. Uses Streamdown for markdown rendering with syntax highlighting. Seamlessly compatible with Modular MAX and other OpenAI-compatible endpoints.',
    },
}
