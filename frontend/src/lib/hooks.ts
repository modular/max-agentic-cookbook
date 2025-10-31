/**
 * Custom hooks for managing endpoint and model selection via URL query params
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import type { Endpoint, Model } from './types'
import { fetchEndpoints, fetchModels } from './api'

/**
 * Hook to manage endpoint selection via URL query param `?e=endpoint-id`
 *
 * - Fetches endpoints from /api/endpoints using SWR
 * - Reads current selection from query param
 * - Auto-selects first endpoint if none specified
 * - Updates query param when selection changes
 */
export function useEndpointFromQuery() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)

    // Fetch endpoints using SWR
    const {
        data: endpoints = [],
        isLoading: loading,
        error: queryError,
    } = useSWR<Endpoint[]>('/api/endpoints', fetchEndpoints)

    const error = queryError ? String(queryError) : null

    // Sync selected endpoint with query param
    useEffect(() => {
        if (endpoints.length === 0) {
            setSelectedEndpoint(null)
            return
        }

        const endpointIdFromQuery = searchParams.get('e')

        // Try to find endpoint from query param
        const endpoint = endpointIdFromQuery
            ? endpoints.find((e) => e.id === endpointIdFromQuery)
            : null

        // Auto-select first if no valid selection
        const finalSelection = endpoint ?? endpoints[0]

        setSelectedEndpoint(finalSelection)

        // Update query param if needed
        if (finalSelection && finalSelection.id !== endpointIdFromQuery) {
            const newParams = new URLSearchParams(searchParams)
            newParams.set('e', finalSelection.id)
            setSearchParams(newParams, { replace: true })
        }
    }, [endpoints, searchParams, setSearchParams])

    // Function to select an endpoint by ID
    const selectEndpoint = (endpointId: string | null) => {
        if (!endpointId) return

        const endpoint = endpoints.find((e) => e.id === endpointId)
        if (!endpoint) return

        const newParams = new URLSearchParams(searchParams)
        newParams.set('e', endpointId)
        setSearchParams(newParams)
    }

    return {
        endpoints,
        selectedEndpoint,
        selectEndpoint,
        loading,
        error,
    }
}

/**
 * Hook to manage model selection via URL query param `?m=model-id`
 *
 * - Fetches models from /api/models?endpointId=xxx using SWR
 * - Reads current selection from query param
 * - Auto-selects first model if none specified
 * - Updates query param when selection changes
 */
export function useModelFromQuery(endpointId: string | null) {
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedModel, setSelectedModel] = useState<Model | null>(null)

    // Fetch models using SWR (only when endpointId is present)
    const {
        data: models = [],
        isLoading: loading,
        error: queryError,
    } = useSWR<Model[]>(
        endpointId ? `/api/models?endpointId=${endpointId}` : null,
        () => fetchModels(endpointId!)
    )

    const error = queryError ? String(queryError) : null

    // Sync selected model with query param
    useEffect(() => {
        if (models.length === 0) {
            setSelectedModel(null)
            return
        }

        const modelIdFromQuery = searchParams.get('m')

        // Try to find model from query param
        const model = modelIdFromQuery
            ? models.find((m) => m.id === modelIdFromQuery)
            : null

        // Auto-select first if no valid selection
        const finalSelection = model ?? models[0]

        setSelectedModel(finalSelection)

        // Update query param if needed
        if (finalSelection && finalSelection.id !== modelIdFromQuery) {
            const newParams = new URLSearchParams(searchParams)
            newParams.set('m', finalSelection.id)
            setSearchParams(newParams, { replace: true })
        }
    }, [models, searchParams, setSearchParams])

    // Function to select a model by ID
    const selectModel = (modelId: string | null) => {
        if (!modelId) return

        const model = models.find((m) => m.id === modelId)
        if (!model) return

        const newParams = new URLSearchParams(searchParams)
        newParams.set('m', modelId)
        setSearchParams(newParams)
    }

    return {
        models,
        selectedModel,
        selectModel,
        loading,
        error,
    }
}
