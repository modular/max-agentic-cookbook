// Path to load Recipes from
export const recipesPath = () => {
    const fromEnv = process.env.NEXT_PUBLIC_RECIPES_PATH ?? '../../packages/recipes/src'
    return fromEnv.replace(/\/$/, '')
}

// Route serving the Cookbook app
export const cookbookRoute = () => {
    const fromEnv = process.env.NEXT_PUBLIC_COOKBOOK_ROUTE ?? '/cookbook'
    return fromEnv.replace(/\/$/, '')
}

// Provides the list of endpoints used by the Cookbook
// Returns Endpoint[]
export const endpointsRoute =
    process.env.NEXT_PUBLIC_COOKBOOK_ENDPOINTS_API ?? '/api/endpoints'

// Proxies the selected endpoint's /models API
// Returns Model[]
export const modelsRoute = process.env.NEXT_PUBLIC_COOKBOOK_MODELS_API ?? '/api/models'
