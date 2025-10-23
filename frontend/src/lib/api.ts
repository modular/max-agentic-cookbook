/**
 * API client utilities for backend communication
 */

import type { Endpoint, Model } from './types'

const API_BASE_URL = '/api'

/**
 * Fetch available endpoints
 */
export async function fetchEndpoints(): Promise<Endpoint[]> {
    const response = await fetch(`${API_BASE_URL}/endpoints`)
    if (!response.ok) {
        throw new Error(`Failed to fetch endpoints: ${response.statusText}`)
    }
    return response.json()
}

/**
 * Fetch available models for a given endpoint
 */
export async function fetchModels(endpointId: string): Promise<Model[]> {
    const params = new URLSearchParams({ endpointId })
    const response = await fetch(`${API_BASE_URL}/models?${params}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
    }
    return response.json()
}

export async function fetchHealthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) {
        throw new Error('Health check failed')
    }
    return response.json()
}

export async function fetchRecipes() {
    const response = await fetch(`${API_BASE_URL}/recipes`)
    if (!response.ok) {
        throw new Error('Failed to fetch recipes')
    }
    return response.json()
}
