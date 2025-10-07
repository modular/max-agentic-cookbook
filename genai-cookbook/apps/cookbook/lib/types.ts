export type RecipeMetadata = {
    slug: string
    title: string
    description?: string
    beCode?: string
    feCode?: string
}

export type Endpoint = {
    id: string
    baseUrl: string
    hwMake?: 'NVIDIA' | 'AMD'
    hwModel?: string
}

export type Model = {
    id: string
    name: string
    baseUrl?: string
}
