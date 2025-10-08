import type { ComponentType } from 'react'
import type { RecipeProps, RecipeContext } from './src/lib/types'

// Import recipe components
import ImageCaptioningUI from './src/image-captioning/ui'
import ImageCaptioningAPI from './src/image-captioning/api'
import MultiturnChatUI from './src/multiturn-chat/ui'
import MultiturnChatAPI from './src/multiturn-chat/api'

export interface RecipeComponents {
    ui: ComponentType<RecipeProps>
    api: (req: Request, context: RecipeContext) => Response | Promise<Response>
}

export const recipeRegistry: Record<string, RecipeComponents> = {
    'image-captioning': {
        ui: ImageCaptioningUI,
        api: ImageCaptioningAPI,
    },
    'multiturn-chat': {
        ui: MultiturnChatUI,
        api: MultiturnChatAPI,
    },
}
