'use client'

import { Flex, Select } from '@mantine/core'
import { useCookbook } from '@/context'
import { useEffect, useState, useCallback } from 'react'
import { modelsRoute } from '@/lib/constants'
import type { Model } from '@modular/recipes/lib/types'

export interface SelectModelProps {
    label?: string
    showRefresh?: boolean
}

export function SelectModel(props: SelectModelProps) {
    const { selectedEndpoint, models, selectedModel, setModels, selectModelById } =
        useCookbook()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const options = models.map(({ id, name }) => ({
        value: id,
        label: name,
    }))

    const fetchModels = useCallback(async () => {
        if (!selectedEndpoint?.baseUrl) {
            setModels([])
            return
        }

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                baseUrl: selectedEndpoint.baseUrl,
                ...(selectedEndpoint.id && { endpointId: selectedEndpoint.id }),
            })

            const response = await fetch(`${modelsRoute}?${params}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const fetchedModels: Model[] = await response.json()
            setModels(fetchedModels)
        } catch (err) {
            const message = (err as Error).message
            console.error('Failed to fetch models:', message)
            setError(message)
            setModels([])
        } finally {
            setLoading(false)
        }
    }, [selectedEndpoint?.baseUrl, selectedEndpoint?.id, setModels])

    // Fetch models when the selected endpoint changes
    useEffect(() => {
        fetchModels()
    }, [fetchModels])

    const getPlaceholder = () => {
        if (loading) return 'Loading models...'
        if (error) return `Error: ${error}`
        if (models.length === 0) return 'No models available'
        return 'Select a model'
    }

    return (
        <Flex gap="xs" align="center">
            <Select
                label={props.label ?? null}
                data={options}
                value={selectedModel?.id || null}
                onChange={(id) => selectModelById(id)}
                placeholder={getPlaceholder()}
                disabled={loading || models.length === 0}
                nothingFoundMessage={error ? `Error: ${error}` : 'No models found'}
                flex={1}
                w="100%"
            />
        </Flex>
    )
}
