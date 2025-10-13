import type { RecipeMetadata } from '../types'

export const recipeMetadata: Record<string, RecipeMetadata> = {
    'image-captioning': {
        slug: 'image-captioning',
        title: 'Image Captioning',
        description:
            "This recipe walks through an end-to-end image captioning workflow that lets you upload pictures, tweak the guiding prompt, and generate natural-language captions through the OpenAI-compatible Vercel AI SDK transport capable of integrating with Modular MAX. The client component manages uploads, gallery state, and Mantine-based UI controls, then forwards the prompt and base64-encoded image to a Next.js API route. That route proxies the request to whichever OpenAI-compatible endpoint you select, using the SDK's chat abstraction to produce a caption and return it to the browser.",
    },
    'multiturn-chat': {
        slug: 'multiturn-chat',
        title: 'Multi-turn Chat',
        description:
            "This recipe demonstrates a Mantine-powered chat surface that streams multi-turn conversations through the Vercel AI SDK, letting you toggle between Modular MAX and other OpenAI-compatible endpoints without rewriting UI logic. The page component keeps composer input, scroll-follow behavior, and the live message list in sync while forwarding each prompt to a Next.js API route. That route adapts the chat transcript into the SDK's message format, invokes the selected model via `openai.chat`, and streams tokens back to the browser so replies render fluidly as they arrive.",
    },
}
