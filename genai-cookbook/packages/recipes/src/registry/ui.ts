'use client'

import type { ComponentType } from 'react'
import type { RecipeProps } from '../types'

import ImageCaptioningUI from '../image-captioning/ui'
import MultiturnChatUI from '../multiturn-chat/ui'
import StreamingThreadsUI from '../streaming-threads/ui'

export type RecipeUiRegistry = Record<string, ComponentType<RecipeProps>>

export const recipeUiRegistry: RecipeUiRegistry = {
    'image-captioning': ImageCaptioningUI,
    'multiturn-chat': MultiturnChatUI,
    'streaming-threads': StreamingThreadsUI,
}
