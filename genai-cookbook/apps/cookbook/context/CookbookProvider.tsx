'use client'

import { createContext, useCallback, useEffect, ReactNode, useState } from 'react'

import type { Endpoint, Model } from '@modular/recipes/lib/types'

interface CookbookContextValue {
    // Endpoints
    endpoints: Endpoint[]
    selectedEndpoint: Endpoint | null
    setEndpoints: (endpoints: Endpoint[]) => void
    selectEndpointById: (id: string | null) => void

    // Models
    models: Model[]
    selectedModel: Model | null
    setModels: (models: Model[]) => void
    selectModelById: (id: string | null) => void
}

interface CookbookProviderProps {
    endpointsRoute: string
    children: ReactNode
}

export const CookbookContext = createContext<CookbookContextValue | undefined>(
    undefined
)

export function CookbookProvider({ children, endpointsRoute }: CookbookProviderProps) {
    const [providerEndpoints, setProviderEndpoints] = useState<Endpoint[]>([])
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)

    const [providerModels, setProviderModels] = useState<Model[]>([])
    const [selectedModel, setSelectedModel] = useState<Model | null>(null)

    useEffect(() => {
        initEndpoints(endpointsRoute).then(setProviderEndpoints)
    }, [endpointsRoute])

    const selectEndpointById = useCallback(
        (id: string | null) => {
            setSelectedEndpoint(
                providerEndpoints.find((e) => e.id === id) ??
                    providerEndpoints[0] ??
                    null
            )
        },
        [providerEndpoints]
    )

    const setEndpoints = useCallback(
        (endpoints: Endpoint[]) => {
            setProviderEndpoints(endpoints)
        },
        [setProviderEndpoints]
    )

    const selectModelById = useCallback(
        (id: string | null) => {
            setSelectedModel(
                providerModels.find((m) => m.id === id) ?? providerModels[0] ?? null
            )
        },
        [providerModels]
    )

    const setModels = useCallback(
        (models: Model[]) => {
            setProviderModels(models)
        },
        [setProviderModels]
    )
    useEffect(() => {
        setSelectedEndpoint((selected) => {
            const keepSelected = selected
                ? providerEndpoints.find((e) => e.id === selected.id)
                : null
            return keepSelected ?? providerEndpoints[0] ?? null
        })
    }, [providerEndpoints])

    useEffect(() => {
        setSelectedModel((selected) => {
            const keepSelected = selected
                ? providerModels.find((m) => m.id === selected.id)
                : null
            return keepSelected ?? providerModels[0] ?? null
        })
    }, [providerModels])

    return (
        <CookbookContext.Provider
            value={{
                // Endpoints
                endpoints: providerEndpoints,
                setEndpoints,
                selectedEndpoint,
                selectEndpointById,

                //Models
                models: providerModels,
                selectedModel,
                setModels,
                selectModelById,
            }}
        >
            {children}
        </CookbookContext.Provider>
    )
}

async function initEndpoints(endpointsRoute: string): Promise<Endpoint[]> {
    try {
        const response = await fetch(endpointsRoute)
        if (!response.ok) {
            throw new Error(`Failed to fetch endpoints: ${response.statusText}`)
        }
        const data = await response.json()
        return Array.isArray(data) ? (data as Endpoint[]) : []
    } catch (e) {
        throw new Error((e as Error)?.message)
    }
}
