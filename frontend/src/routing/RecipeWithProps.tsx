/**
 * RecipeWithProps - Wrapper component that provides endpoint, model, and pathname props to recipes
 */

import type { ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { useEndpointFromQuery, useModelFromQuery } from '../lib/hooks'
import type { RecipeProps } from '../lib/types'

export function RecipeWithProps({
    Component: RecipeComponent,
}: {
    Component: ComponentType<RecipeProps>
}) {
    const location = useLocation()
    const { selectedEndpoint } = useEndpointFromQuery()
    const { selectedModel } = useModelFromQuery(selectedEndpoint?.id || null)

    return (
        <RecipeComponent
            endpoint={selectedEndpoint}
            model={selectedModel}
            pathname={location.pathname}
        />
    )
}
