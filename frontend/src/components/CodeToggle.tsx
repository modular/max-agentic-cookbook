/**
 * CodeToggle - Toggle between demo and code view
 *
 * Allows users to switch between viewing the recipe UI and the source code.
 * Uses React Router's Link for navigation between `/recipe` and `/recipe/code`.
 */

import { Button, Text } from '@mantine/core'
import { IconCode, IconSparkles } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'

export function CodeToggle() {
    const location = useLocation()
    const iconSize = 16

    // Check if we're on the /code view
    const showingCode = location.pathname.endsWith('/code')

    const Toggle = ({
        to,
        label,
        icon,
    }: {
        to: string
        label: string
        icon?: React.ReactNode
    }) => {
        return (
            <Button
                variant="light"
                size="compact-sm"
                radius="xl"
                component={Link}
                to={to}
            >
                {icon}
                <Text size="sm" fw="500" p="6px">
                    {label}
                </Text>
            </Button>
        )
    }

    if (showingCode) {
        return (
            <Toggle
                to={location.pathname.replace(/\/code$/, '')}
                label="Back to Demo"
                icon={<IconSparkles size={iconSize} />}
            />
        )
    }

    return (
        <Toggle
            to={`${location.pathname}/code`}
            label="Show Code"
            icon={<IconCode size={iconSize} />}
        />
    )
}
