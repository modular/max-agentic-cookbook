/**
 * ViewSelector - Toggle between readme, demo, and code views
 *
 * Allows users to switch between viewing the recipe README, UI, and source code.
 * Uses Mantine's SegmentedControl for navigation between views.
 */

import { SegmentedControl } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router-dom'

export function ViewSelector() {
    const location = useLocation()
    const navigate = useNavigate()

    // Determine current view based on pathname
    const getCurrentView = (): string => {
        if (location.pathname.endsWith('/readme')) {
            return 'readme'
        }
        if (location.pathname.endsWith('/code')) {
            return 'code'
        }
        return 'demo'
    }

    const currentView = getCurrentView()

    // Get base path (recipe slug without view suffix)
    const getBasePath = (): string => {
        const path = location.pathname
        return path.replace(/\/(readme|code)$/, '')
    }

    const basePath = getBasePath()

    const handleChange = (value: string) => {
        switch (value) {
            case 'readme':
                navigate(`${basePath}/readme`)
                break
            case 'demo':
                navigate(basePath)
                break
            case 'code':
                navigate(`${basePath}/code`)
                break
        }
    }

    return (
        <SegmentedControl
            value={currentView}
            onChange={handleChange}
            data={[
                { label: 'Demo', value: 'demo' },
                { label: 'Readme', value: 'readme' },
                { label: 'Code', value: 'code' },
            ]}
        />
    )
}
