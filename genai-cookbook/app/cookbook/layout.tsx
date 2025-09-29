'use client'

import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { headerHeight, navbarWidth } from '@/theme/theme'

import Header from '@/components/Header'
import Navbar from '@/components/Navbar'

interface CookbookShellProps {
    children: React.ReactNode
}

export default function CookbookShell({ children }: CookbookShellProps) {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)

    return (
        <AppShell
            header={{ height: headerHeight }}
            navbar={{
                width: navbarWidth,
                breakpoint: 'sm',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Header
                    mobileOpened={mobileOpened}
                    toggleMobile={toggleMobile}
                    toggleDesktop={toggleDesktop}
                />
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <Navbar />
            </AppShell.Navbar>
            <AppShell.Main>{children}</AppShell.Main>
        </AppShell>
    )
}
