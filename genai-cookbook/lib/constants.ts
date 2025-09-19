export const recipesPath = () => {
    const fromEnv = process.env.NEXT_PUBLIC_RECIPES_PATH ?? '/recipes'
    return fromEnv.replace(/\/$/, '')
}

export const endpointsRoute =
    process.env.NEXT_PUBLIC_COOKBOOK_ENDPOINTS_API ?? '/api/endpoints'

export const modelsRoute = process.env.NEXT_PUBLIC_COOKBOOK_MODELS_API ?? '/api/models'
