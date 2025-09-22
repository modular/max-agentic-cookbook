import Link from 'next/link'
import { Button, Text } from '@mantine/core'
import { IconCode, IconSparkles } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useEffect } from 'react'

export function ShowCodeToggle() {
    const [showingCode, setShowingCode] = useState(false)
    const pathname = usePathname()
    const iconSize = 16

    useEffect(() => {
        setShowingCode(pathname.endsWith('/code') ? true : false)
    }, [pathname])

    const Toggle = ({
        href,
        label,
        icon,
    }: {
        href: string
        label: string
        icon?: React.ReactNode
    }) => {
        return (
            <Button size="compact-sm" radius="xl">
                <>
                    {icon}
                    <Text size="sm" fw="500" p="6px">
                        <Link href={`${pathname}${href}`}>{label}</Link>
                    </Text>
                </>
            </Button>
        )
    }

    return (
        <>
            {showingCode ? (
                <Toggle
                    href="/.."
                    label="Back to Demo"
                    icon={<IconSparkles size={iconSize} />}
                />
            ) : (
                <Toggle
                    href="/code"
                    label="Show Code"
                    icon={<IconCode size={iconSize} />}
                />
            )}
        </>
    )
}
