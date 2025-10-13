import type { RecipeContext } from '../types'

import ImageCaptioningAPI from '../image-captioning/api'
import MultiturnChatAPI from '../multiturn-chat/api'

export type RecipeApiHandler = (
    req: Request,
    context: RecipeContext
) => Response | Promise<Response>

export const recipeApiRegistry: Record<string, RecipeApiHandler> = {
    'image-captioning': ImageCaptioningAPI,
    'multiturn-chat': MultiturnChatAPI,
}
